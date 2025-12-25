// Build verification tests
describe('Build Configuration', () => {
    it('should have correct package name', () => {
        const pkg = require('../../package.json');
        expect(pkg.name).toBe('customer');
    });

    it('should have required scripts', () => {
        const pkg = require('../../package.json');
        expect(pkg.scripts.dev).toBeDefined();
        expect(pkg.scripts.build).toBeDefined();
        expect(pkg.scripts.test).toBeDefined();
    });

    it('should have required dependencies', () => {
        const pkg = require('../../package.json');
        expect(pkg.dependencies.next).toBeDefined();
        expect(pkg.dependencies['next-intl']).toBeDefined();
        expect(pkg.dependencies.react).toBeDefined();
    });
});
