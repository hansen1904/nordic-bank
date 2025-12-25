// Build verification tests
import pkg from '../../package.json';

describe('Build Configuration', () => {
    it('should have correct package name', () => {
        expect(pkg.name).toBe('customer');
    });

    it('should have required scripts', () => {
        expect(pkg.scripts.dev).toBeDefined();
        expect(pkg.scripts.build).toBeDefined();
        expect(pkg.scripts.test).toBeDefined();
    });

    it('should have required dependencies', () => {
        expect(pkg.dependencies.next).toBeDefined();
        expect(pkg.dependencies['next-intl']).toBeDefined();
        expect(pkg.dependencies.react).toBeDefined();
    });
});
