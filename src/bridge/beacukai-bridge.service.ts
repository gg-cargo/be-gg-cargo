import { Injectable, Logger } from '@nestjs/common';
import * as soap from 'soap';

type BridgeStatus = 'success' | 'fail' | 'unauthorized';

@Injectable()
export class BeacukaiBridgeService {
    private readonly logger = new Logger(BeacukaiBridgeService.name);
    private readonly wsdlUrl = 'https://xpdcargo.id/modulCN23/beacukai/WSBarangKiriman.wsdl';
    private readonly authId = 'opssuppo^$xpdc2027';
    private readonly authSign = 'T1RBek5qVXhNalUxTFRJMQ0K';
    private readonly timeoutMs = 60000;
    private clientPromise: Promise<soap.Client> | null = null;

    async kirim(xml: string): Promise<string> {
        const client = await this.getClient();
        const payload = {
            data: `<CN_PIBK>${xml}</CN_PIBK>`,
            id: this.authId,
            sign: this.authSign,
        };
        const [result] = await this.withTimeout(
            client.kirimDataAsync(payload) as Promise<any[]>,
            this.timeoutMs
        );
        return this.extractSoapReturn(result);
    }

    async respon(noBarang: string, tglHouseBlawb: string): Promise<string> {
        const client = await this.getClient();
        const dataXml = [
            '<CEK_STATUS><HEADER>',
            `<NPWP>903651255225000</NPWP>`,
            `<NO_BARANG>${noBarang}</NO_BARANG>`,
            `<TGL_HOUSE_BLAWB>${tglHouseBlawb}</TGL_HOUSE_BLAWB>`,
            '</HEADER></CEK_STATUS>',
        ].join('');
        const payload = {
            data: dataXml,
            id: this.authId,
            sign: this.authSign,
        };
        const [result] = await this.withTimeout(
            client.getResponByAwbAsync(payload) as Promise<any[]>,
            this.timeoutMs
        );
        return this.extractSoapReturn(result);
    }

    logBridgeCall(endpoint: string, status: BridgeStatus, startedAt: number, error?: any): void {
        const durationMs = Date.now() - startedAt;
        const logPayload = {
            timestamp: new Date().toISOString(),
            endpoint: `/bridge/beacukai/${endpoint}`,
            status,
            duration_ms: durationMs,
            error_message: error?.message,
        };
        if (status === 'success') {
            this.logger.log(JSON.stringify(logPayload));
        } else {
            this.logger.warn(JSON.stringify(logPayload));
        }
    }

    private async getClient(): Promise<soap.Client> {
        if (!this.clientPromise) {
            this.clientPromise = soap.createClientAsync(this.wsdlUrl, {
                wsdl_options: {
                    timeout: this.timeoutMs,
                },
            });
        }
        return this.clientPromise;
    }

    private async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('SOAP request timeout'));
            }, timeoutMs);
            promise
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(error => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    private extractSoapReturn(result: any): string {
        if (result === undefined || result === null) {
            return '';
        }
        if (typeof result === 'string') {
            return result;
        }
        if (typeof result === 'object') {
            if (Object.prototype.hasOwnProperty.call(result, 'return')) {
                return result.return;
            }
            const keys = Object.keys(result);
            if (keys.length === 1) {
                return result[keys[0]];
            }
        }
        return JSON.stringify(result);
    }
}
