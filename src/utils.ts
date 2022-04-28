export function formatParams(params: string): string {
    function formatParam(param: string): string {
        return param.split('=').map(p => p.trim()).join(' = ')
    }
    return params.split(',').map(p => formatParam(p.trim())).join(', ');
}
