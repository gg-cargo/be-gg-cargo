import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import axios from 'axios';
import * as FormData from 'form-data';
import * as sharp from 'sharp';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - heic-convert has no types
import heicConvert from 'heic-convert';

@Injectable()
export class OcrService {
    constructor(private readonly configService: ConfigService) { }

    async extractKtpData(file: Express.Multer.File): Promise<{ data: any; raw: any }> {
        // Preprocess gambar: konversi → rotasi sesuai EXIF → grayscale → normalize → upscale → sharpen → threshold
        const preprocessed = await this.preprocessToPng(file.buffer, file.mimetype);

        const apiUrl = this.configService.get<string>('OCR_API_URL') || 'https://api.ocr.space/parse/image';
        const apiKey = this.configService.get<string>('OCR_API_KEY');
        if (!apiKey) {
            throw new Error('Konfigurasi OCR_API_KEY belum diset');
        }

        // Gunakan bahasa dari env jika diset; default ke 'auto' (Engine 2)
        const preferredLang = this.configService.get<string>('OCR_LANGUAGE') || 'auto';

        const buildForm = (lang: string) => {
            const f = new FormData();
            f.append('apikey', apiKey);
            f.append('language', lang);               // e.g. 'auto' or 'eng'
            f.append('OCREngine', '2');               // Engine 2 recommended
            f.append('detectOrientation', 'true');    // autorotate
            f.append('isTable', 'true');              // line-by-line
            f.append('scale', 'true');                // internal upscaling
            f.append('isOverlayRequired', 'false');
            f.append('filetype', 'PNG');
            f.append('file', preprocessed, { filename: 'ktp.png', contentType: 'image/png' });
            return f;
        };

        // Attempt with preferred language, fallback to 'eng' if E201
        let response;
        try {
            response = await axios.post(apiUrl, buildForm(preferredLang), {
                headers: { ...buildForm(preferredLang).getHeaders() },
                timeout: 30000,
                maxContentLength: Infinity as any,
                maxBodyLength: Infinity as any,
            });
        } catch (e: any) {
            // Retry with 'eng' if server rejected language
            response = await axios.post(apiUrl, buildForm('eng'), {
                headers: { ...buildForm('eng').getHeaders() },
                timeout: 30000,
                maxContentLength: Infinity as any,
                maxBodyLength: Infinity as any,
            });
        }

        const raw = response.data;
        // Cek jika ada overlay lines
        let parsed;
        const overlay = raw?.ParsedResults?.[0]?.TextOverlay?.Lines;
        if (overlay && Array.isArray(overlay) && overlay.length > 0) {
            // Gunakan array string baris dari TextOverlay.Lines
            const ocrLines = overlay.map((x: any) => x.LineText || '').filter(Boolean);
            parsed = this.parseKtpFromOverlay(ocrLines);
        } else {
            const text = this.pickTextFromRaw(raw);
            parsed = this.parseKtpText(text);
        }
        return { data: parsed, raw };
    }

    private pickTextFromRaw(raw: any): string {
        if (!raw) return '';
        if (typeof raw === 'string') return raw;
        if (raw.ParsedResults && Array.isArray(raw.ParsedResults)) {
            const parts = raw.ParsedResults.map((r: any) => r?.ParsedText || '').filter(Boolean);
            return parts.join('\n');
        }
        if (raw.text) return raw.text;
        return JSON.stringify(raw ?? {});
    }

    private parseKtpText(text: string) {
        const clean = (s: string) => (s || '')
            .replace(/[©™®|~_\-–—•·]/g, ' ')
            .replace(/[“”‘’]/g, '')
            .replace(/[\t\r]/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        // Normalisasi typo umum label OCR
        const norm = clean(
            text
                .replace(/TempalTo/gi, 'Tempat/Tgl')
                .replace(/ketamin/gi, 'kelamin')
                .replace(/Kel\/Dosa/gi, 'Kel/Desa')
                .replace(/Komarganegaraan/gi, 'Kewarganegaraan')
                .replace(/Bedaku\s+Hingoa/gi, 'Berlaku Hingga')
        );

        // Split per line, hapus kosong
        const lines = norm.split(/\n/).map(l => clean(l)).filter(Boolean);

        // Helper untuk ambil value pada : di satu baris, jika tidak ada, cek baris setelahnya
        function pick(label: string | RegExp) {
            const idx = lines.findIndex(line =>
                typeof label === 'string'
                    ? line.toLowerCase().replace(/\s/g, '').startsWith(label.toLowerCase().replace(/\s/g, ''))
                    : label.test(line)
            );
            if (idx !== -1) {
                const match = lines[idx].match(/: *(.*)$/);
                if (match && match[1]) {
                    return clean(match[1]);
                } else if (lines[idx + 1] && !/:/g.test(lines[idx + 1])) {
                    // Baris berikutnya adalah value (tidak ada colon)
                    return clean(lines[idx + 1]);
                }
            }
            return '';
        }

        // ============ Field-Field ============
        let nik = '', nama_lengkap = '', tempat_lahir = '', tanggal_lahir = '', jenis_kelamin = '', gol_darah = '',
            alamat_ktp = '', provinsi_ktp = '', kota_ktp = '', rt_rw = '', kel_desa = '', kecamatan = '', agama = '',
            status_perkawinan = '', pekerjaan = '', kewarganegaraan = '', berlaku_hingga = '';

        nik = lines.map(l => (l.match(/\b\d{16}\b/) || [])[0]).filter(Boolean)[0] || '';
        nama_lengkap = pick('nama') || '';
        // Tempat/tgl lahir
        const ttlstr = pick('tempat/tgl') || lines.find(l => /tempat.*lahir/i.test(l)) || '';
        if (ttlstr) {
            const match = ttlstr.match(/([A-Z ]+)[,;] *(\d{2})[-/](\d{2})[-/](\d{4})/i) ||
                ttlstr.match(/([A-Z ]+) +(\d{2})[-/](\d{2})[-/](\d{4})/i);
            if (match) {
                tempat_lahir = clean(match[1]);
                tanggal_lahir = `${match[4]}-${match[3]}-${match[2]}`;
            } else {
                const split = ttlstr.split(',');
                tempat_lahir = clean(split[0]);
                tanggal_lahir = (split[1] || '').replace(/[^0-9-]/g, '').replace(/(\d{2})-(\d{2})-(\d{4})/g, '$3-$2-$1');
            }
        }
        // Jenis kelamin
        const jk_line = lines.find(l => /kelamin/i.test(l));
        jenis_kelamin = /PEREMPUAN/i.test(jk_line || '') ? 'PEREMPUAN' : 'LAKI-LAKI';
        gol_darah = pick('gol. darah') || pick(/gol(\.|\s*)darah/i);
        alamat_ktp = pick('alamat');
        rt_rw = pick('rt/rw');
        kel_desa = pick('kel/desa') || pick('kelurahan') || pick('desa');
        kecamatan = pick('kecamatan');
        agama = pick('agama');
        status_perkawinan = lines.find(l => /status.*kawin/i.test(l))?.replace(/^.*: *|STATUS[ \w]* /i, '').trim().toUpperCase() || '';
        pekerjaan = pick('pekerjaan');
        kewarganegaraan = pick('kewarganegaraan');
        berlaku_hingga = pick('berlaku hingga');

        provinsi_ktp = (lines.find(l => l.includes('PROVINSI')) || '').replace(/^PROVINSI\s*/i, '').trim().toUpperCase();
        kota_ktp = (lines.find(l => l.includes('KABUPATEN')) || lines.find(l => l.includes('KOTA')) || '').replace(/^(KABUPATEN|KOTA)\s*/i, '').trim().toUpperCase();

        return {
            nik,
            nama_lengkap: nama_lengkap.toUpperCase(),
            tempat_lahir: tempat_lahir.toUpperCase(),
            tanggal_lahir,
            jenis_kelamin,
            gol_darah: gol_darah ? gol_darah.toUpperCase() : '',
            alamat_ktp,
            provinsi_ktp,
            kota_ktp,
            rt_rw,
            kel_desa,
            kecamatan,
            agama,
            status_perkawinan,
            pekerjaan,
            kewarganegaraan,
            berlaku_hingga,
        };
    }

    // Helper baru: parsing KTP menggunakan TextOverlay.Lines
    private parseKtpFromOverlay(lines: string[]): any {
        const clean = (s: string) => (s || '').replace(/[©™®|~_\-–—•·]/g, ' ').replace(/[“”‘’]/g, '').replace(/[\t\r]/g, ' ').replace(/\s{2,}/g, ' ').trim();

        // Daftar label KTP untuk validasi label
        const labelList = [
            'nik', 'nama', 'tempat/tgl lahir', 'tempat/tgl', 'tempattgllahir', 'jenis kelamin', 'gol. darah', 'alamat', 'rt/rw', 'kel/desa',
            'kelurahan', 'desa', 'kecamatan', 'agama', 'status perkawinan', 'pekerjaan', 'kewarganegaraan', 'komarganegaraan', 'berlaku hingga',
            'bedaku hingoa', 'provinsi', 'kabupaten', 'kota'
        ];
        function isKtpLabel(line: string) {
            const l = line.replace(/[^a-z]/gi, '').toLowerCase();
            return labelList.some(lbl => l.startsWith(lbl.replace(/[^a-z]/gi, '')));
        }
        // Normalizer typo label → standar
        const normLabel = (lab: string) => (
            lab.toLowerCase()
                .replace('komarganegaraan', 'kewarganegaraan')
                .replace('bedaku hingoa', 'berlaku hingga')
                .replace('tempalto', 'tempat/tgl')
                .replace('tempat tgl lahir', 'tempat/tgl lahir')
                .replace('tempattgllahir', 'tempat/tgl lahir')
                .replace('kel/dosa', 'kel/desa')
                .replace('kecamatan™', 'kecamatan')
        );
        // Cari value di baris setelah label, value baris sekarang, atau value setelah ':'
        function cariField(label: string) {
            label = normLabel(label);
            for (let i = 0; i < lines.length; i++) {
                let baris = normLabel(lines[i].replace(/\s+/g, ' ').trim().toLowerCase());
                if (baris.startsWith(label)) {
                    // Cek setelah ':' jika ada
                    const colon = lines[i].indexOf(':');
                    let value = '';
                    if (colon !== -1 && lines[i].slice(colon + 1).trim() !== '') {
                        value = lines[i].slice(colon + 1).trim().replace(/^\:?\-?\s*/, '');
                    } else {
                        // Cari baris value selanjutnya yang bukan label
                        let j = i + 1;
                        while (j < lines.length) {
                            let candidate = lines[j].trim();
                            if (candidate !== '' && !isKtpLabel(candidate.toLowerCase())) {
                                value = candidate.replace(/^\:?\-?\s*/, '');
                                break;
                            } else if (candidate !== '') {
                                break; // next line is another label, so no value
                            }
                            j++;
                        }
                    }
                    return clean(value);
                }
            }
            return '';
        }
        // NIK khusus
        let nik = lines.map(l => (l.match(/\b\d{16}\b/) || [])[0]).filter(Boolean)[0] || '';
        let nama_lengkap = cariField('nama');
        const ttlstr = cariField('tempat/tgl lahir') || cariField('tempat tgl lahir') || cariField('tempat/tgl');
        let tempat_lahir = '', tanggal_lahir = '';
        if (ttlstr) {
            const match = ttlstr.match(/([A-Z ]+)[,;]?\s*(\d{2})[\-\/](\d{2})[\-\/](\d{4})/i);
            if (match) {
                tempat_lahir = clean(match[1]);
                tanggal_lahir = `${match[4]}-${match[3]}-${match[2]}`;
            } else {
                const split = ttlstr.split(',');
                tempat_lahir = clean(split[0]);
                tanggal_lahir = (split[1] || '').replace(/[^0-9-]/g, '').replace(/(\d{2})-(\d{2})-(\d{4})/g, '$3-$2-$1');
            }
        }
        const jk_val = cariField('jenis kelamin');
        const jenis_kelamin = /PEREMPUAN/i.test(jk_val) ? 'PEREMPUAN' : 'LAKI-LAKI';
        const gol_darah = cariField('gol. darah').toUpperCase();
        const alamat_ktp = cariField('alamat');
        const rt_rw = cariField('rt/rw');
        let kel_desa = cariField('kel/desa') || cariField('kelurahan') || cariField('desa');
        let kecamatan = cariField('kecamatan');
        const agama = cariField('agama');
        let status_perkawinan = cariField('status perkawinan').toUpperCase();
        if (!status_perkawinan) {
            // kadang dapat: 'Status Perkawinar BELUM KAWIN'
            const l = lines.find(l => /status.*kawin/i.test(l));
            if (l) status_perkawinan = clean(l.split(/:| /).pop() || '').toUpperCase();
        }
        const pekerjaan = cariField('pekerjaan');
        let kewarganegaraan = cariField('kewarganegaraan');
        let berlaku_hingga = cariField('berlaku hingga').toUpperCase();
        // Header admin
        let provinsi_ktp = '';
        let kota_ktp = '';
        for (let line of lines) {
            let up = line.toUpperCase();
            if (up.startsWith('PROVINSI')) {
                provinsi_ktp = line.replace(/PROVINSI\s*/i, '').trim().toUpperCase();
            }
            if (up.startsWith('KABUPATEN')) {
                kota_ktp = line.replace(/KABUPATEN\s*/i, '').trim().toUpperCase();
            }
            if (up.startsWith('KOTA')) {
                kota_ktp = line.replace(/KOTA\s*/i, '').trim().toUpperCase();
            }
        }
        // Clean up khusus jika value diawali / diakhiri '-', ':'
        if (kel_desa.startsWith('-')) kel_desa = kel_desa.slice(1).trim();
        if (kecamatan.startsWith('-')) kecamatan = kecamatan.slice(1).trim();
        if (berlaku_hingga.startsWith(':')) berlaku_hingga = berlaku_hingga.slice(1).trim();
        if (berlaku_hingga.startsWith('-')) berlaku_hingga = berlaku_hingga.slice(1).trim();
        if (kewarganegaraan.startsWith(':')) kewarganegaraan = kewarganegaraan.slice(1).trim();
        if (kewarganegaraan.startsWith('-')) kewarganegaraan = kewarganegaraan.slice(1).trim();
        if (tempat_lahir.startsWith(':')) tempat_lahir = tempat_lahir.slice(1).trim();
        return {
            nik,
            nama_lengkap: (nama_lengkap || '').toUpperCase(),
            tempat_lahir: (tempat_lahir || '').toUpperCase(),
            tanggal_lahir,
            jenis_kelamin,
            gol_darah,
            alamat_ktp,
            provinsi_ktp,
            kota_ktp,
            rt_rw,
            kel_desa,
            kecamatan,
            agama,
            status_perkawinan,
            pekerjaan,
            kewarganegaraan,
            berlaku_hingga,
        };
    }

    private pickAfterLabel(lines: string[], labels: string[]): string | undefined {
        const idx = lines.findIndex(l => labels.some(lb => l.toLowerCase().startsWith(lb)));
        if (idx >= 0) {
            const line = lines[idx];
            const sep = line.indexOf(':');
            if (sep >= 0) return line.slice(sep + 1).trim();
            return line.replace(new RegExp(`^(${labels.join('|')})`, 'i'), '').trim();
        }
        return undefined;
    }

    private pickAddressBlock(lines: string[]): string {
        const idx = lines.findIndex(l => /^alamat\b/i.test(l));
        if (idx < 0) return '';
        const parts = [lines[idx].replace(/^alamat\s*:?\s*/i, '')];
        for (let i = idx + 1; i < Math.min(lines.length, idx + 4); i++) {
            const v = lines[i];
            if (/^(rt|rw|kel|desa|kec|kecamatan)\b/i.test(v) || v.length <= 80) {
                parts.push(v);
            } else {
                break;
            }
        }
        return parts
            .filter(Boolean)
            .map(p => p.replace(/[~_\-–—•·]/g, ' ').replace(/\s{2,}/g, ' ').trim())
            .join(', ')
            .replace(/\s{2,}/g, ' ')
            .trim();
    }

    private async toPngBuffer(buffer: Buffer, mime?: string): Promise<Buffer> {
        // HEIC/HEIF handling first if mimetype indicates so
        if (mime && /heic|heif/i.test(mime)) {
            try {
                const output = await (heicConvert as any)({ buffer, format: 'PNG', quality: 1 });
                return Buffer.from(output);
            } catch (_) {
                // fall through to sharp attempt
            }
        }

        try {
            return await (sharp as any)(buffer).png().toBuffer();
        } catch (err) {
            // If sharp failed, try HEIC convert as a fallback (some HEIC are mislabeled)
            try {
                const output = await (heicConvert as any)({ buffer, format: 'PNG', quality: 1 });
                return Buffer.from(output);
            } catch (_) {
                throw err;
            }
        }
    }

    private async preprocessToPng(buffer: Buffer, mime?: string): Promise<Buffer> {
        const png = await this.toPngBuffer(buffer, mime);
        return await (sharp as any)(png)
            .rotate()
            .grayscale()
            .normalize()
            .resize({ width: 2000, withoutEnlargement: false })
            .sharpen()
            .threshold(140)
            .png({ compressionLevel: 9 })
            .toBuffer();
    }
}


