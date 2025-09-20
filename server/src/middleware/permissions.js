// Middleware: يسمح فقط للمستخدمين الذين لديهم صلاحية 'admin' أو 'accounting'
export function requireAccountingAccess(req, res, next) {
  // مثال: يفترض أن المستخدم وصلاحياته موجودة في req.user.roles
  // إذا كنت تستخدم JWT أو أي نظام مصادقة آخر، عدل حسب الحاجة
  const user = req.user;
  if (!user || !user.roles || !user.roles.includes('admin') && !user.roles.includes('accounting')) {
    return res.status(403).json({ error: 'ليس لديك صلاحية الوصول للعمليات المحاسبية.' });
  }
  next();
}
