// IframeSandbox.js – configures iframe sandbox attributes and security
export class IframeSandbox {
    constructor() {
        this.permissions = 'allow-scripts allow-same-origin allow-forms allow-popups allow-modals';
        this.csp = "default-src 'self'; style-src 'self' 'unsafe-inline';";
    }

    apply(iframe) {
        iframe.setAttribute('sandbox', this.permissions);
        // Optionally set CSP via iframe csp attribute (experimental)
        iframe.setAttribute('csp', this.csp);
    }
}
