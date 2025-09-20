import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const CompanyLogo = sequelize.define('CompanyLogo', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'اسم الملف المحفوظ'
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'الاسم الأصلي للملف'
  },
  mimetype: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'نوع الملف'
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'حجم الملف بالبايت'
  },
  data: {
    type: DataTypes.BLOB,
    allowNull: false,
    comment: 'بيانات الملف'
  },
  upload_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: 'تاريخ الرفع'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: 'هل الشعار نشط'
  }
  }, {
    tableName: 'company_logo',
    timestamps: false,
    comment: 'جدول شعار الشركة'
  });

  return CompanyLogo;
};
