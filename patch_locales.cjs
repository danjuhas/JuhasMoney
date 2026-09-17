const fs = require('fs');

const langs = ['pt', 'en', 'es'];

const newKeys = {
  pt: {
    notifications: {
      title: "Notificações",
      mark_read: "Marcar lidas",
      clear_history: "Limpar histórico",
      all_good: "Tudo certo por aqui!",
      no_new: "Você não tem novas notificações.",
      today: "hoje",
      tomorrow: "amanhã",
      in_days: "em {{count}} dias",
      bill_due_single: "Conta vence {{when}}!",
      bill_due_multiple: "{{count}} contas vencem {{when}}!",
      bill_desc_single: "{{description}} no valor de {{amount}} vence {{when}}.",
      bill_desc_multiple: "Você tem contas totalizando {{amount}} vencendo {{when}}."
    }
  },
  en: {
    notifications: {
      title: "Notifications",
      mark_read: "Mark as read",
      clear_history: "Clear history",
      all_good: "All good here!",
      no_new: "You have no new notifications.",
      today: "today",
      tomorrow: "tomorrow",
      in_days: "in {{count}} days",
      bill_due_single: "Bill due {{when}}!",
      bill_due_multiple: "{{count}} bills due {{when}}!",
      bill_desc_single: "{{description}} of {{amount}} is due {{when}}.",
      bill_desc_multiple: "You have bills totaling {{amount}} due {{when}}."
    }
  },
  es: {
    notifications: {
      title: "Notificaciones",
      mark_read: "Marcar como leídas",
      clear_history: "Borrar historial",
      all_good: "¡Todo bien por aquí!",
      no_new: "No tienes nuevas notificaciones.",
      today: "hoy",
      tomorrow: "mañana",
      in_days: "en {{count}} días",
      bill_due_single: "¡Factura vence {{when}}!",
      bill_due_multiple: "¡{{count}} facturas vencen {{when}}!",
      bill_desc_single: "{{description}} de {{amount}} vence {{when}}.",
      bill_desc_multiple: "Tienes facturas por un total de {{amount}} que vencen {{when}}."
    }
  }
};

langs.forEach(lang => {
  const file = `src/locales/${lang}/common.json`;
  let data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.notifications = newKeys[lang].notifications;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
});
