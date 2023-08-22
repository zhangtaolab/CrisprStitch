import { AsyncGunzip } from 'fflate';

export function unzip(files: File[]) {
    files.map(async (file) => {
        const gunzip = new AsyncGunzip();
        const reader = file.stream().getReader()
        gunzip.ondata = (_, data, final) => {
            console.log(new TextDecoder().decode(data))
            if (final) {
                console.log('done')
            }
        }
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                gunzip.push(new Uint8Array(0), true)
                break;
            }
            gunzip.push(value)
        }
    })
}