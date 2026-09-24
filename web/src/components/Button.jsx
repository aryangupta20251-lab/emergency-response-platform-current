export default function Button({ children, variant = 'primary', size = 'medium', type = 'button', ...props }) {
  return <button type={type} className={`btn btn--${variant} btn--${size}`} {...props}>{children}</button>
}
