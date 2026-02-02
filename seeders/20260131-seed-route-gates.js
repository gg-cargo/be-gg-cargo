'use strict';

const fs = require('fs');
const path = require('path');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const geojsonPath = path.resolve(__dirname, '../../frontend/public/ast_bpjt_gerbangtol.geojson');
    if (!fs.existsSync(geojsonPath)) {
      console.warn('GeoJSON file not found at', geojsonPath);
      return;
    }

    const raw = fs.readFileSync(geojsonPath, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse geojson', e);
      throw e;
    }

    const features = Array.isArray(data.features) ? data.features : [];
    const records = features.map((f) => {
      const coords = f.geometry && f.geometry.coordinates ? f.geometry.coordinates : null;
      const lng = coords && coords.length >= 2 ? Number(coords[0]) : null;
      const lat = coords && coords.length >= 2 ? Number(coords[1]) : null;
      const props = f.properties || {};
      const name = props.nama || props.name || props.NAMA || 'Unknown';
      const externalId = props.id || props.gid || f.id || null;
      // Try to infer type; default to 'tol'
      const type = (props.tipe || props.type || '').toString().toLowerCase().includes('pelab') ? 'pelabuhan' : 'tol';
      const tollFee = Number(props.harga || props.toll_fee || props.tarif || 0) || 0;

      return {
        master_route_id: null,
        external_id: externalId ? String(externalId) : null,
        name: String(name),
        type,
        lat,
        lng,
        toll_fee: tollFee,
        sequence_index: null,
        created_at: new Date(),
        updated_at: new Date(),
      };
    }).filter(r => r.lat !== null && r.lng !== null);

    if (records.length === 0) {
      console.warn('No valid features found in geojson');
      return;
    }

    // bulk insert in batches to avoid huge single insert
    const batchSize = 1000;
    for (let i = 0; i < records.length; i += batchSize) {
      const chunk = records.slice(i, i + batchSize);
      // ensure column names match migration (route_gates)
      await queryInterface.bulkInsert('route_gates', chunk, {});
    }

    console.log(`Inserted ${records.length} route_gates from geojson`);
  },

  async down(queryInterface, Sequelize) {
    // attempt to remove inserted entries by matching names present in geojson
    const geojsonPath = path.resolve(__dirname, '../../frontend/public/ast_bpjt_gerbangtol.geojson');
    if (!fs.existsSync(geojsonPath)) {
      return;
    }
    const raw = fs.readFileSync(geojsonPath, 'utf8');
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return;
    }
    const features = Array.isArray(data.features) ? data.features : [];
    const names = features.map((f) => {
      const props = f.properties || {};
      return props.nama || props.name || props.NAMA || null;
    }).filter(Boolean);

    if (names.length === 0) return;

    // delete by name
    await queryInterface.bulkDelete('route_gates', { name: names }, {});
  },
};

