// Допускаем пользователя только если его роль входит в allowed.
// Использование: requireRoles('VORD', 'MANAGER', 'TRAINER')
const requireRoles = (...allowed) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'Auth required' });
  }
  const role = (req.user.role || '').toUpperCase();
  if (!allowed.map(r => r.toUpperCase()).includes(role)) {
    return res.status(403).json({ success: false, error: 'Forbidden: role not allowed' });
  }
  next();
};

// Проверить, что req.user.type === 'employee' (любой сотрудник)
const requireEmployee = (req, res, next) => {
  if (req.user?.type !== 'employee') {
    return res.status(403).json({ success: false, error: 'Employee only' });
  }
  next();
};

const requireClient = (req, res, next) => {
  if (req.user?.type !== 'client') {
    return res.status(403).json({ success: false, error: 'Client only' });
  }
  next();
};

module.exports = { requireRoles, requireEmployee, requireClient };
