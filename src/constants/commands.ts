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
    SORTEO: {
        NAME: 'sorteo',
        DESCRIPTION: 'Inicia un nuevo sorteo en el servidor'
    }
};
