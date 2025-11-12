const canRegister =
    typeof globalThis !== 'undefined' &&
    !!(globalThis as any).document &&
    !!(globalThis as any).customElements;

if (canRegister) {
    // @ts-ignore
    import('../loader/index.js')
        .then(({ defineCustomElements }) => defineCustomElements())
        .catch(() => {
        });
}

export async function registerAll(): Promise<void> {
    // @ts-ignore
    const { defineCustomElements } = await import('../loader/index.js');
    defineCustomElements();
}
