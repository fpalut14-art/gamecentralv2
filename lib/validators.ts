export function required(value?: string) { return !!value && value.trim().length > 0; }
export function validPrice(value: string | number) { return Number(value) > 0; }
