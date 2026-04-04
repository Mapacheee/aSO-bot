export const COMMANDS = {
    BAN: {
        NAME: 'ban',
        DESCRIPTION: 'Banea a un usuario temporalmente',
        OPT_USER: 'user',
        OPT_USER_DESC: 'Usuario a banear'
    },
    MUTE: {
        NAME: 'mute',
        DESCRIPTION: 'Mutea a un usuario temporalmente',
        OPT_USER: 'user',
        OPT_USER_DESC: 'Usuario a mutear'
    },
    UNMUTE: {
        NAME: 'unmute',
        DESCRIPTION: 'Desmutea a un usuario',
        OPT_USER: 'user',
        OPT_USER_DESC: 'Usuario a desmutear'
    },
    KICK: {
        NAME: 'kick',
        DESCRIPTION: 'Expulsa a un usuario del servidor',
        OPT_USER: 'user',
        OPT_USER_DESC: 'Usuario a expulsar'
    },
    UNBAN: {
        NAME: 'unban',
        DESCRIPTION: 'Desbanea a un usuario por ID',
        OPT_USER: 'userid',
        OPT_USER_DESC: 'ID del usuario a desbanear'
    },
    BORRARHISTORIAL: {
        NAME: 'borrarhistorial',
        DESCRIPTION: 'Limpia el historial de mensajes de un usuario',
        OPT_USER: 'user',
        OPT_USER_DESC: 'Usuario del que se borrarán los mensajes'
    },
    CLEAR: {
        NAME: 'clear',
        DESCRIPTION: 'Limpia mensajes en el canal actual'
    },
    SETUP_VOICE: {
        NAME: 'setup-voice',
        DESCRIPTION: 'Configura el botón de creación de canales de voz'
    },
    MENSAJE: {
        NAME: 'mensaje',
        DESCRIPTION: 'Envía un mensaje como el bot',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El texto a enviar'
    },
    MENSAJE_EMBED: {
        NAME: 'mensaje-embed',
        DESCRIPTION: 'Envía un mensaje en un embed',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El texto del embed'
    },
    IMAGEN: {
        NAME: 'imagen',
        DESCRIPTION: 'Envía una imagen como el bot',
        OPT_IMG: 'imagen',
        OPT_IMG_DESC: 'La imagen a enviar'
    },
    IMAGEN_EMBED: {
        NAME: 'imagen-embed',
        DESCRIPTION: 'Envía una imagen en un embed',
        OPT_IMG: 'imagen',
        OPT_IMG_DESC: 'La imagen del embed'
    },
    MENSAJE_IMAGEN: {
        NAME: 'mensaje-imagen',
        DESCRIPTION: 'Envía un mensaje con imagen',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El texto a enviar',
        OPT_IMG: 'imagen',
        OPT_IMG_DESC: 'La imagen a enviar'
    },
    MENSAJE_IMAGEN_EMBED: {
        NAME: 'mensaje-imagen-embed',
        DESCRIPTION: 'Envía un mensaje y una imagen en un embed',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El texto del embed',
        OPT_IMG: 'imagen',
        OPT_IMG_DESC: 'La imagen del embed'
    },
    AYUDA: {
        NAME: 'ayuda',
        DESCRIPTION: 'Muestra la lista de todos los comandos disponibles'
    },
    SETUP_STATUS: {
        NAME: 'setup-status',
        DESCRIPTION: 'Configura el panel en vivo del estado del servidor de CS:GO en el canal actual'
    },
    SETUP_LOGS: {
        NAME: 'setup-logs',
        DESCRIPTION: 'Configura el canal de logs de mensajes editados y eliminados'
    },
    SORTEO: {
        NAME: 'sorteo',
        DESCRIPTION: 'Inicia un nuevo sorteo en el servidor'
    },
    VOTACION: {
        NAME: 'votacion',
        DESCRIPTION: 'Crea una nueva votación en el canal'
    },
    NOMINAR: {
        NAME: 'nominar',
        DESCRIPTION: 'Crea una sesión de nominación de mapas para un evento'
    },
    SETUP_NOTIFICACIONES: {
        NAME: 'setup-notificaciones',
        DESCRIPTION: 'Crea el panel de notificaciones de mapas en este canal'
    },
    SETUP_TICKET: {
        NAME: 'setup-ticket',
        DESCRIPTION: 'Crea el panel de tickets en este canal'
    },
    SETUP_WARNS: {
        NAME: 'setup-warns',
        DESCRIPTION: 'Crea el panel de gestión de warns de CS:GO en este canal'
    },
    TICKET_ADD: {
        NAME: 'ticket-add',
        DESCRIPTION: 'Añade a un usuario al ticket actual',
        OPT_USER: 'usuario',
        OPT_USER_DESC: 'El usuario que deseas añadir al ticket'
    },
    TICKET_REMOVE: {
        NAME: 'ticket-remove',
        DESCRIPTION: 'Remueve a un usuario del ticket actual',
        OPT_USER: 'usuario',
        OPT_USER_DESC: 'El usuario que deseas remover del ticket'
    },
    TICKET_LOGS: {
        NAME: 'ticket-logs',
        DESCRIPTION: 'Muestra el historial de tickets cerrados de un usuario',
        OPT_USER: 'usuario',
        OPT_USER_DESC: 'El usuario a buscar'
    },
    TICKET_READ: {
        NAME: 'ticket-read',
        DESCRIPTION: 'Descarga la transcripción de un ticket cerrado por su ID',
        OPT_ID: 'id',
        OPT_ID_DESC: 'El ID numérico del ticket'
    },
    SETUP_SUGERENCIAS: {
        NAME: 'setup-sugerencias',
        DESCRIPTION: 'Crea el panel de sugerencias en este canal'
    },
    BINDS: {
        NAME: 'binds',
        DESCRIPTION: 'Muestra una lista de binds útiles para el servidor de CS:GO'
    },
    SETUP_INFORMACION: {
        NAME: 'setup-informacion',
        DESCRIPTION: 'Crea el panel de información del servidor (Reglas, VIP, etc.)'
    },
    ADD_RULE: {
        NAME: 'add-rule',
        DESCRIPTION: 'Añade una regla al servidor',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El texto de la regla'
    },
    REMOVE_RULE: {
        NAME: 'remove-rule',
        DESCRIPTION: 'Elimina una regla del servidor',
        OPT_ID: 'id',
        OPT_ID_DESC: 'El ID de la regla a eliminar'
    },
    ADD_VIP: {
        NAME: 'add-vip',
        DESCRIPTION: 'Añade un beneficio VIP al servidor',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El texto del beneficio'
    },
    REMOVE_VIP: {
        NAME: 'remove-vip',
        DESCRIPTION: 'Elimina un beneficio VIP del servidor',
        OPT_ID: 'id',
        OPT_ID_DESC: 'El ID del beneficio a eliminar'
    },
    SET_INFO: {
        NAME: 'set-info',
        DESCRIPTION: 'Configura el texto de información para ZE o ZM',
        OPT_TIPO: 'tipo',
        OPT_TIPO_DESC: 'Elige entre zombie_escape o zombie_mod',
        OPT_TEXT: 'texto',
        OPT_TEXT_DESC: 'El nuevo texto para esta sección'
    }
};
