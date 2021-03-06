'use strict';

var ItemDescription = spec.frequire(__filename)();

describe('ItemDescription', function() {

  it('should return a number for a given style', function() {
    expect(ItemDescription.numberForStyle('cheryl')).toBe(1401);
    expect(ItemDescription.numberForStyle('test')).toBe(9999);
    expect(ItemDescription.numberForStyle(null)).toBe(9999);
  });

  it('should make a sku with a given style, color, and size', function() {
    expect(ItemDescription.makeSKU('cheryl', 'red', '0 | 2 55')).toBe('1401red0255');
    expect(ItemDescription.makeSKU('cheryl', 'red', ['0', '2', '55'])).toBe('1401red0255');
    expect(ItemDescription.makeSKU()).toBe('');
  });

  it('should get the length of the size', function() {
    expect(ItemDescription.sizeLength('0 | 2 55')).toBe('55');
    expect(ItemDescription.sizeLength(null)).toBe('0');
    expect(ItemDescription.sizeLength('')).toBe('0');
    expect(ItemDescription.sizeLength('0')).toBe('0');
    expect(ItemDescription.sizeLength('0 | 2')).toBe('0');
    expect(ItemDescription.sizeLength('0 | 2 | 59')).toBe('59');
    expect(ItemDescription.sizeLength('0 | 2 Long')).toBe('59');
    expect(ItemDescription.sizeLength('0 | 2 Regular')).toBe('55');
  });

  it('should translate style and size to cut', function() {
    expect(ItemDescription.cutForStyleLength('cheryl', '0 | 2')).toBe('cocktail');
    expect(ItemDescription.cutForStyleLength('cheryl', '0 | 2 55')).toBe('cocktail');
    expect(ItemDescription.cutForStyleLength('test', '0 | 2')).toBe('');
    expect(ItemDescription.cutForStyleLength(null, null)).toBe('');
    expect(ItemDescription.cutForStyleLength('leigh', '0 | 2 55')).toBe('skirt - 42"');
    expect(ItemDescription.cutForStyleLength('leigh', '0 | 2 59')).toBe('skirt - 45"');
    expect(ItemDescription.cutForStyleLength('leigh', '0 | 2 0')).toBe('');
  });

  it('should return a nice size description', function() {
    var i = new ItemDescription();
    i.import({ style: 'teststyle', color: 'testcolor', size: '0 | 2 55'});
    expect(i.sizeDesc).toBe('0 | 2 regular');

    i = new ItemDescription();
    i.import({ style: 'teststyle', color: 'testcolor', size: '0 | 2 59'});
    expect(i.sizeDesc).toBe('0 | 2 long');

    i = new ItemDescription();
    i.import({ style: 'teststyle', color: 'testcolor', size: '0 | 2 regular'});
    expect(i.sizeDesc).toBe('0 | 2 regular');

    i = new ItemDescription();
    i.import({ style: 'teststyle', color: 'testcolor', size: '0 | 2 Long'});
    expect(i.sizeDesc).toBe('0 | 2 long');
  });
});
