describe('main source index', () => {
  it('should be a valid module', () => {
    // testing that the main source index module is valid
    const module = require('../index');
    expect(module).toBeDefined();
  });

  it('should have main function defined', () => {
    // testing that the main function loads without errors
    expect(() => require('../index')).not.toThrow();
  });

  it('should be able to import the module', () => {
    // testing that the module can be imported without errors
    expect(() => {
      require('../index');
    }).not.toThrow();
  });
});
