const required = (val: string) => val !== '' || 'required'
const validSeq = (val:string) => /^[ATCGatcg]+$/.test(val) || 'Please input a valid sequence'

export {
    required,
    validSeq
}