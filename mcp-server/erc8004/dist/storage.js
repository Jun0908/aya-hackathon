import fs from 'fs';
import path from 'path';
const dataDir = path.resolve(process.cwd(), 'data');
const valDir = path.resolve(process.cwd(), 'validations');
export function ensureDirs() {
    if (!fs.existsSync(dataDir))
        fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(valDir))
        fs.mkdirSync(valDir, { recursive: true });
}
export function saveAnalysis(hashHex, obj) {
    ensureDirs();
    const p = path.join(dataDir, `${hashHex}.json`);
    fs.writeFileSync(p, JSON.stringify(obj, null, 2));
    return p;
}
export function loadAnalysis(hashHex) {
    const p = path.join(dataDir, `${hashHex}.json`);
    if (!fs.existsSync(p))
        return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}
export function saveValidation(hashHex, obj) {
    ensureDirs();
    const p = path.join(valDir, `${hashHex}.json`);
    fs.writeFileSync(p, JSON.stringify(obj, null, 2));
    return p;
}
