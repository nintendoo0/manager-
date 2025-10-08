import React from 'react';

export default function NeonButton({ children, onClick, icon, className = '', ...props }) {
  return (
    <button className={`btn btn-primary ${className}`} onClick={onClick} {...props}>
      {icon && <span style={{display:'inline-flex', marginRight:8}}>{icon}</span>}
      <span>{children}</span>
    </button>
  );
}