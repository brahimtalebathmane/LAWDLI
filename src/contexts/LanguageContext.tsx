import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const translations = {
  ar: {
    // Auth
    login: 'تسجيل الدخول',
    phoneNumber: 'رقم الهاتف',
    pinCode: 'رمز PIN',
    loginButton: 'دخول',
    invalidCredentials: 'بيانات الدخول غير صحيحة',
    
    // Navigation
    dashboard: 'لوحة التحكم',
    requests: 'الطلبات',
    groups: 'المجموعات',
    users: 'المستخدمين',
    notifications: 'الإشعارات',
    logout: 'تسجيل الخروج',
    
    // Dashboard
    welcome: 'مرحباً',
    totalRequests: 'إجمالي الطلبات',
    totalGroups: 'إجمالي المجموعات',
    totalUsers: 'إجمالي المستخدمين',
    recentActivity: 'النشاط الأخير',
    
    // Requests
    createRequest: 'إنشاء طلب جديد',
    requestTitle: 'عنوان الطلب',
    requestDescription: 'وصف الطلب',
    selectGroups: 'اختر المجموعات',
    uploadImage: 'رفع صورة',
    sendRequest: 'إرسال الطلب',
    
    // Responses
    available: 'موجود',
    notAvailable: 'غير موجود',
    alternative: 'بديل',
    respond: 'رد',
    
    // Groups
    createGroup: 'إنشاء مجموعة',
    groupName: 'اسم المجموعة',
    groupDescription: 'وصف المجموعة',
    members: 'الأعضاء',
    
    // Users
    createUser: 'إنشاء مستخدم',
    fullName: 'الاسم الكامل',
    role: 'الدور',
    admin: 'مدير',
    user: 'مستخدم',
    
    // Common
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    loading: 'جارِ التحميل...',
    noData: 'لا توجد بيانات',
    success: 'تم بنجاح',
    error: 'خطأ',
    confirm: 'تأكيد',
    
    // Push notifications
    'push.new_request.title': 'طلب جديد',
    'push.new_request.body': 'لديك طلب جديد{{title}}',
    'push.new_response.title': 'رد جديد على الطلب',
    'push.new_response.body': '{{full_name}} رد بـ "{{choice}}"',
    'notifications.enable': 'تفعيل الإشعارات',
    'notifications.permission_denied': 'تم رفض إذن الإشعارات. يرجى تفعيلها من إعدادات المتصفح.',
    
    // Refresh and loading
    'refresh': 'تحديث',
    'refreshing': 'جارِ التحديث...',
    'lastUpdated': 'آخر تحديث',
    'refreshData': 'تحديث البيانات',
    'autoRefresh': 'تحديث تلقائي',
    
    // Form labels
    'optional': 'اختياري',
    'imageRequired': 'مطلوب صورة واحدة على الأقل (JPEG أو PNG)',
  },
  fr: {
    // Auth
    login: 'Connexion',
    phoneNumber: 'Numéro de téléphone',
    pinCode: 'Code PIN',
    loginButton: 'Se connecter',
    invalidCredentials: 'Identifiants invalides',
    
    // Navigation
    dashboard: 'Tableau de bord',
    requests: 'Demandes',
    groups: 'Groupes',
    users: 'Utilisateurs',
    notifications: 'Notifications',
    logout: 'Déconnexion',
    
    // Dashboard
    welcome: 'Bienvenue',
    totalRequests: 'Total des demandes',
    totalGroups: 'Total des groupes',
    totalUsers: 'Total des utilisateurs',
    recentActivity: 'Activité récente',
    
    // Requests
    createRequest: 'Créer une demande',
    requestTitle: 'Titre de la demande',
    requestDescription: 'Description de la demande',
    selectGroups: 'Sélectionner les groupes',
    uploadImage: 'Télécharger une image',
    sendRequest: 'Envoyer la demande',
    
    // Responses
    available: 'Disponible',
    notAvailable: 'Indisponible',
    alternative: 'Alternative',
    respond: 'Répondre',
    
    // Groups
    createGroup: 'Créer un groupe',
    groupName: 'Nom du groupe',
    groupDescription: 'Description du groupe',
    members: 'Membres',
    
    // Users
    createUser: 'Créer un utilisateur',
    fullName: 'Nom complet',
    role: 'Rôle',
    admin: 'Administrateur',
    user: 'Utilisateur',
    
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    loading: 'Chargement...',
    noData: 'Aucune donnée',
    success: 'Succès',
    error: 'Erreur',
    confirm: 'Confirmer',
    
    // Push notifications
    'push.new_request.title': 'Nouvelle demande',
    'push.new_request.body': 'Vous avez une nouvelle demande{{title}}',
    'push.new_response.title': 'Nouvelle réponse',
    'push.new_response.body': '{{full_name}} a répondu "{{choice}}"',
    'notifications.enable': 'Activer les notifications',
    'notifications.permission_denied': 'Permission de notification refusée. Veuillez l\'activer dans les paramètres du navigateur.',
    
    // Refresh and loading
    'refresh': 'Actualiser',
    'refreshing': 'Actualisation...',
    'lastUpdated': 'Dernière mise à jour',
    'refreshData': 'Actualiser les données',
    'autoRefresh': 'Actualisation automatique',
    
    // Form labels
    'optional': 'Optionnel',
    'imageRequired': 'Au moins une image est requise (JPEG ou PNG)',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');

  useEffect(() => {
    try {
      const storedLang = localStorage.getItem('lawdli_language') as Language;
      if (storedLang && (storedLang === 'ar' || storedLang === 'fr')) {
        setLanguageState(storedLang);
      } else {
        // Initialize with default language if not set or invalid
        localStorage.setItem('lawdli_language', 'ar');
        setLanguageState('ar');
      }
    } catch (error) {
      console.error('Error accessing localStorage for language:', error);
      // Use default language if localStorage is not available
      setLanguageState('ar');
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('lawdli_language', lang);
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[Language]] || key;
  };

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};