/**
 * Basic setup test to verify Jest configuration
 */
describe('Jest Setup', () => {
  it('should run tests correctly', () => {
    expect(true).toBe(true);
  });

  it('should have access to DOM testing utilities', () => {
    const div = document.createElement('div');
    div.textContent = 'Hello World';
    document.body.appendChild(div);
    expect(div).toBeInTheDocument();
    document.body.removeChild(div);
  });

  it('should have localStorage mock available', () => {
    localStorage.setItem('test', 'value');
    expect(localStorage.getItem('test')).toBe('value');
  });
});