import { Link, useLocation } from 'react-router-dom';

export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);
  const trail = parts.map((p, i) => ({
    label: decodeURIComponent(p),
    to: '/' + parts.slice(0, i + 1).join('/'),
  }));

  return (
    <div className="px-4 lg:px-6 py-3 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-primary">Home</Link>
      {trail.map((t, i) => (
        <span key={t.to}>
          {' / '}
          {i < trail.length - 1 ? (
            <Link to={t.to} className="hover:text-primary capitalize">{t.label}</Link>
          ) : (
            <span className="capitalize">{t.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

