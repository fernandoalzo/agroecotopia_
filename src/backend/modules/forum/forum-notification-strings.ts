type NotificationStrings = {
  postCreated: {
    title: string;
    message: (title: string) => string;
  };
  answerCreated: {
    title: (isReply: boolean) => string;
    message: (actorName: string, isReply: boolean, postTitle: string) => string;
  };
  answerEdited: {
    title: string;
    message: (actorName: string, postTitle: string) => string;
  };
};

const strings: Record<string, NotificationStrings> = {
  es: {
    postCreated: {
      title: "Nueva Publicación en la Comunidad",
      message: (title: string) => `Se ha creado una nueva publicación: "${title}".`,
    },
    answerCreated: {
      title: (isReply: boolean) =>
        isReply ? "Nueva respuesta a tu comentario" : "Nueva respuesta en tu publicación",
      message: (actorName: string, isReply: boolean, postTitle: string) =>
        `${actorName} respondió${isReply ? " a tu comentario" : ""} en: "${postTitle}"`,
    },
    answerEdited: {
      title: "Comentario editado",
      message: (actorName: string, postTitle: string) =>
        `${actorName} editó su comentario en: "${postTitle}"`,
    },
  },
  en: {
    postCreated: {
      title: "New Community Post",
      message: (title: string) => `A new post has been created: "${title}".`,
    },
    answerCreated: {
      title: (isReply: boolean) =>
        isReply ? "New reply to your comment" : "New answer to your post",
      message: (actorName: string, isReply: boolean, postTitle: string) =>
        `${actorName} replied${isReply ? " to your comment" : ""} on: "${postTitle}"`,
    },
    answerEdited: {
      title: "Comment edited",
      message: (actorName: string, postTitle: string) =>
        `${actorName} edited their comment on: "${postTitle}"`,
    },
  },
};

export function getForumNotificationStrings(locale: string = "es"): NotificationStrings {
  return strings[locale] ?? strings.es;
}
