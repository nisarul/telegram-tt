import { Api as GramJs } from '../../../lib/gramjs';
import type {
  ApiMessage,
  ApiMessageForwardInfo,
  ApiPhoto,
  ApiSticker,
  ApiVideo,
  ApiVoice,
  ApiAudio,
  ApiDocument,
  ApiAction,
  ApiContact,
  ApiAttachment,
  ApiPoll,
  ApiNewPoll,
  ApiWebPage,
  ApiMessageEntity,
  ApiFormattedText,
  ApiReplyKeyboard,
  ApiKeyboardButton,
  ApiChat,
  ApiThreadInfo,
  ApiInvoice,
  ApiGroupCall,
  ApiReactions,
  ApiReactionCount,
  ApiPeerReaction,
  ApiAvailableReaction,
  ApiSponsoredMessage,
  ApiUser,
  ApiLocation,
  ApiGame,
  PhoneCallAction,
  ApiWebDocument,
  ApiMessageEntityDefault,
  ApiMessageExtendedMediaPreview,
  ApiReaction,
  ApiReactionEmoji,
} from '../../types';
import {
  ApiMessageEntityTypes,
} from '../../types';

import {
  DELETED_COMMENTS_CHANNEL_ID,
  SERVICE_NOTIFICATIONS_USER_ID,
  SPONSORED_MESSAGE_CACHE_MS,
  SUPPORTED_AUDIO_CONTENT_TYPES,
  SUPPORTED_IMAGE_CONTENT_TYPES,
  SUPPORTED_VIDEO_CONTENT_TYPES,
  VIDEO_MOV_TYPE,
  VIDEO_WEBM_TYPE,
} from '../../../config';
import { pick } from '../../../util/iteratees';
import { buildStickerFromDocument } from './symbols';
import {
  buildApiPhoto, buildApiPhotoSize, buildApiThumbnailFromPath, buildApiThumbnailFromStripped,
} from './common';
import { interpolateArray } from '../../../util/waveform';
import { buildPeer } from '../gramjsBuilders';
import { addPhotoToLocalDb, resolveMessageApiChatId, serializeBytes } from '../helpers';
import { buildApiPeerId, getApiChatIdFromMtpPeer, isPeerUser } from './peers';
import { buildApiCallDiscardReason } from './calls';
import { getEmojiOnlyCountForMessage } from '../../../global/helpers/getEmojiOnlyCountForMessage';
import { getServerTimeOffset } from '../../../util/serverTime';

const LOCAL_MESSAGES_LIMIT = 1e6; // 1M

const LOCAL_MEDIA_UPLOADING_TEMP_ID = 'temp';
const INPUT_WAVEFORM_LENGTH = 63;

let localMessageCounter = 0;
function getNextLocalMessageId(lastMessageId = 0) {
  return lastMessageId + (++localMessageCounter / LOCAL_MESSAGES_LIMIT);
}

let currentUserId!: string;

export function setMessageBuilderCurrentUserId(_currentUserId: string) {
  currentUserId = _currentUserId;
}

export function buildApiSponsoredMessage(mtpMessage: GramJs.SponsoredMessage): ApiSponsoredMessage | undefined {
  const {
    fromId, message, entities, startParam, channelPost, chatInvite, chatInviteHash, randomId, recommended, sponsorInfo,
    additionalInfo,
  } = mtpMessage;
  const chatId = fromId ? getApiChatIdFromMtpPeer(fromId) : undefined;
  const chatInviteTitle = chatInvite
    ? (chatInvite instanceof GramJs.ChatInvite
      ? chatInvite.title
      : !(chatInvite.chat instanceof GramJs.ChatEmpty) ? chatInvite.chat.title : undefined)
    : undefined;

  return {
    randomId: serializeBytes(randomId),
    isBot: fromId ? isPeerUser(fromId) : false,
    text: buildMessageTextContent(message, entities),
    expiresAt: Math.round(Date.now() / 1000) + SPONSORED_MESSAGE_CACHE_MS,
    isRecommended: Boolean(recommended),
    ...(chatId && { chatId }),
    ...(chatInviteHash && { chatInviteHash }),
    ...(chatInvite && { chatInviteTitle }),
    ...(startParam && { startParam }),
    ...(channelPost && { channelPostId: channelPost }),
    ...(sponsorInfo && { sponsorInfo }),
    ...(additionalInfo && { additionalInfo }),
  };
}

export function buildApiMessage(mtpMessage: GramJs.TypeMessage): ApiMessage | undefined {
  const chatId = resolveMessageApiChatId(mtpMessage);
  if (
    !chatId
    || !(mtpMessage instanceof GramJs.Message || mtpMessage instanceof GramJs.MessageService)) {
    return undefined;
  }

  return buildApiMessageWithChatId(chatId, mtpMessage);
}

export function buildApiMessageFromShort(mtpMessage: GramJs.UpdateShortMessage): ApiMessage {
  const chatId = buildApiPeerId(mtpMessage.userId, 'user');

  return buildApiMessageWithChatId(chatId, {
    ...mtpMessage,
    fromId: buildPeer(mtpMessage.out ? currentUserId : buildApiPeerId(mtpMessage.userId, 'user')),
  });
}

export function buildApiMessageFromShortChat(mtpMessage: GramJs.UpdateShortChatMessage): ApiMessage {
  const chatId = buildApiPeerId(mtpMessage.chatId, 'chat');

  return buildApiMessageWithChatId(chatId, {
    ...mtpMessage,
    fromId: buildPeer(buildApiPeerId(mtpMessage.fromId, 'user')),
  });
}

export function buildApiMessageFromNotification(
  notification: GramJs.UpdateServiceNotification,
  currentDate: number,
): ApiMessage {
  const localId = getNextLocalMessageId(currentDate);
  const content = buildMessageContent(notification);

  return {
    id: localId,
    chatId: SERVICE_NOTIFICATIONS_USER_ID,
    date: notification.inboxDate || currentDate,
    content,
    isOutgoing: false,
  };
}

type UniversalMessage = (
  Pick<GramJs.Message & GramJs.MessageService, ('id' | 'date')>
  & Pick<Partial<GramJs.Message & GramJs.MessageService>, (
    'out' | 'message' | 'entities' | 'fromId' | 'peerId' | 'fwdFrom' | 'replyTo' | 'replyMarkup' | 'post' |
    'media' | 'action' | 'views' | 'editDate' | 'editHide' | 'mediaUnread' | 'groupedId' | 'mentioned' | 'viaBotId' |
    'replies' | 'fromScheduled' | 'postAuthor' | 'noforwards' | 'reactions' | 'forwards' | 'silent' | 'pinned'
  )>
);

export function buildApiMessageWithChatId(
  chatId: string,
  mtpMessage: UniversalMessage,
): ApiMessage {
  const fromId = mtpMessage.fromId ? getApiChatIdFromMtpPeer(mtpMessage.fromId) : undefined;
  const peerId = mtpMessage.peerId ? getApiChatIdFromMtpPeer(mtpMessage.peerId) : undefined;
  const isChatWithSelf = !fromId && chatId === currentUserId;
  const isOutgoing = (mtpMessage.out && !mtpMessage.post) || (isChatWithSelf && !mtpMessage.fwdFrom);
  const content = buildMessageContent(mtpMessage);
  const action = mtpMessage.action
    && buildAction(mtpMessage.action, fromId, peerId, Boolean(mtpMessage.post), isOutgoing);
  if (action) {
    content.action = action;
  }
  const isScheduled = mtpMessage.date > (Math.round(Date.now() / 1000) + getServerTimeOffset());

  const isInvoiceMedia = mtpMessage.media instanceof GramJs.MessageMediaInvoice
    && Boolean(mtpMessage.media.extendedMedia);

  const {
    replyToMsgId, replyToTopId, forumTopic, replyToPeerId,
  } = mtpMessage.replyTo || {};
  const isEdited = mtpMessage.editDate && !mtpMessage.editHide;
  const {
    inlineButtons, keyboardButtons, keyboardPlaceholder, isKeyboardSingleUse, isKeyboardSelective,
  } = buildReplyButtons(mtpMessage, isInvoiceMedia) || {};
  const forwardInfo = mtpMessage.fwdFrom && buildApiMessageForwardInfo(mtpMessage.fwdFrom, isChatWithSelf);
  const { replies, mediaUnread: isMediaUnread, postAuthor } = mtpMessage;
  const groupedId = mtpMessage.groupedId && String(mtpMessage.groupedId);
  const isInAlbum = Boolean(groupedId) && !(content.document || content.audio || content.sticker);
  const shouldHideKeyboardButtons = mtpMessage.replyMarkup instanceof GramJs.ReplyKeyboardHide;
  const isHideKeyboardSelective = mtpMessage.replyMarkup instanceof GramJs.ReplyKeyboardHide
    && mtpMessage.replyMarkup.selective;
  const isProtected = mtpMessage.noforwards || isInvoiceMedia;
  const isForwardingAllowed = !mtpMessage.noforwards;
  const emojiOnlyCount = getEmojiOnlyCountForMessage(content, groupedId);

  return {
    id: mtpMessage.id,
    chatId,
    isOutgoing,
    content,
    date: mtpMessage.date,
    senderId: fromId || (mtpMessage.out && mtpMessage.post && currentUserId) || chatId,
    views: mtpMessage.views,
    forwards: mtpMessage.forwards,
    isScheduled,
    isFromScheduled: mtpMessage.fromScheduled,
    isSilent: mtpMessage.silent,
    isPinned: mtpMessage.pinned,
    reactions: mtpMessage.reactions && buildMessageReactions(mtpMessage.reactions),
    emojiOnlyCount,
    ...(replyToMsgId && { replyToMessageId: replyToMsgId }),
    ...(forumTopic && { isTopicReply: true }),
    ...(replyToPeerId && { replyToChatId: getApiChatIdFromMtpPeer(replyToPeerId) }),
    ...(replyToTopId && { replyToTopMessageId: replyToTopId }),
    ...(forwardInfo && { forwardInfo }),
    ...(isEdited && { isEdited }),
    ...(mtpMessage.editDate && { editDate: mtpMessage.editDate }),
    ...(isMediaUnread && { isMediaUnread }),
    ...(mtpMessage.mentioned && isMediaUnread && { hasUnreadMention: true }),
    ...(mtpMessage.mentioned && { isMentioned: true }),
    ...(groupedId && {
      groupedId,
      isInAlbum,
    }),
    inlineButtons,
    ...(keyboardButtons && {
      keyboardButtons, keyboardPlaceholder, isKeyboardSingleUse, isKeyboardSelective,
    }),
    ...(shouldHideKeyboardButtons && { shouldHideKeyboardButtons, isHideKeyboardSelective }),
    ...(mtpMessage.viaBotId && { viaBotId: buildApiPeerId(mtpMessage.viaBotId, 'user') }),
    ...(replies && { repliesThreadInfo: buildThreadInfo(replies, mtpMessage.id, chatId) }),
    ...(postAuthor && { postAuthorTitle: postAuthor }),
    isProtected,
    isForwardingAllowed,
  };
}

export function buildMessageReactions(reactions: GramJs.MessageReactions): ApiReactions {
  const {
    recentReactions, results, canSeeList,
  } = reactions;

  return {
    canSeeList,
    results: results.map(buildReactionCount).filter(Boolean).sort(reactionCountComparator),
    recentReactions: recentReactions?.map(buildMessagePeerReaction).filter(Boolean),
  };
}

function reactionCountComparator(a: ApiReactionCount, b: ApiReactionCount) {
  const diff = b.count - a.count;
  if (diff) return diff;
  if (a.chosenOrder !== undefined && b.chosenOrder !== undefined) {
    return a.chosenOrder - b.chosenOrder;
  }
  if (a.chosenOrder !== undefined) return 1;
  if (b.chosenOrder !== undefined) return -1;
  return 0;
}

function buildReactionCount(reactionCount: GramJs.ReactionCount): ApiReactionCount | undefined {
  const { chosenOrder, count, reaction } = reactionCount;

  const apiReaction = buildApiReaction(reaction);
  if (!apiReaction) return undefined;

  return {
    chosenOrder,
    count,
    reaction: apiReaction,
  };
}

export function buildMessagePeerReaction(userReaction: GramJs.MessagePeerReaction): ApiPeerReaction | undefined {
  const {
    peerId, reaction, big, unread, date, my,
  } = userReaction;

  const apiReaction = buildApiReaction(reaction);
  if (!apiReaction) return undefined;

  return {
    peerId: getApiChatIdFromMtpPeer(peerId),
    reaction: apiReaction,
    addedDate: date,
    isUnread: unread,
    isBig: big,
    isOwn: my,
  };
}

export function buildApiReaction(reaction: GramJs.TypeReaction): ApiReaction | undefined {
  if (reaction instanceof GramJs.ReactionEmoji) {
    return {
      emoticon: reaction.emoticon,
    };
  }

  if (reaction instanceof GramJs.ReactionCustomEmoji) {
    return {
      documentId: reaction.documentId.toString(),
    };
  }

  return undefined;
}

export function buildApiAvailableReaction(availableReaction: GramJs.AvailableReaction): ApiAvailableReaction {
  const {
    selectAnimation, staticIcon, reaction, title, appearAnimation,
    inactive, aroundAnimation, centerIcon, effectAnimation, activateAnimation,
    premium,
  } = availableReaction;

  return {
    selectAnimation: buildApiDocument(selectAnimation),
    appearAnimation: buildApiDocument(appearAnimation),
    activateAnimation: buildApiDocument(activateAnimation),
    effectAnimation: buildApiDocument(effectAnimation),
    staticIcon: buildApiDocument(staticIcon),
    aroundAnimation: aroundAnimation ? buildApiDocument(aroundAnimation) : undefined,
    centerIcon: centerIcon ? buildApiDocument(centerIcon) : undefined,
    reaction: { emoticon: reaction } as ApiReactionEmoji,
    title,
    isInactive: inactive,
    isPremium: premium,
  };
}

export function buildMessageContent(
  mtpMessage: UniversalMessage | GramJs.UpdateServiceNotification,
) {
  let content: ApiMessage['content'] = {};

  if (mtpMessage.media) {
    content = {
      ...buildMessageMediaContent(mtpMessage.media),
    };
  }

  const hasUnsupportedMedia = mtpMessage.media instanceof GramJs.MessageMediaUnsupported;

  if (mtpMessage.message && !hasUnsupportedMedia
    && !content.sticker && !content.poll && !content.contact && !(content.video?.isRound)) {
    content = {
      ...content,
      text: buildMessageTextContent(mtpMessage.message, mtpMessage.entities),
    };
  }

  return content;
}

export function buildMessageTextContent(
  message: string,
  entities?: GramJs.TypeMessageEntity[],
): ApiFormattedText {
  return {
    text: message,
    ...(entities && { entities: entities.map(buildApiMessageEntity) }),
  };
}

export function buildMessageDraft(draft: GramJs.TypeDraftMessage) {
  if (draft instanceof GramJs.DraftMessageEmpty) {
    return undefined;
  }

  const {
    message, entities, replyToMsgId, date,
  } = draft;

  return {
    formattedText: message ? buildMessageTextContent(message, entities) : undefined,
    replyingToId: replyToMsgId,
    date,
  };
}

export function buildMessageMediaContent(media: GramJs.TypeMessageMedia): ApiMessage['content'] | undefined {
  if ('ttlSeconds' in media && media.ttlSeconds) {
    return undefined;
  }

  if ('extendedMedia' in media && media.extendedMedia instanceof GramJs.MessageExtendedMedia) {
    return buildMessageMediaContent(media.extendedMedia.media);
  }

  const sticker = buildSticker(media);
  if (sticker) return { sticker };

  const photo = buildPhoto(media);
  if (photo) return { photo };

  const video = buildVideo(media);
  if (video) return { video };

  const audio = buildAudio(media);
  if (audio) return { audio };

  const voice = buildVoice(media);
  if (voice) return { voice };

  const document = buildDocumentFromMedia(media);
  if (document) return { document };

  const contact = buildContact(media);
  if (contact) return { contact };

  const poll = buildPollFromMedia(media);
  if (poll) return { poll };

  const webPage = buildWebPage(media);
  if (webPage) return { webPage };

  const invoice = buildInvoiceFromMedia(media);
  if (invoice) return { invoice };

  const location = buildLocationFromMedia(media);
  if (location) return { location };

  const game = buildGameFromMedia(media);
  if (game) return { game };

  return undefined;
}

function buildApiMessageForwardInfo(fwdFrom: GramJs.MessageFwdHeader, isChatWithSelf = false): ApiMessageForwardInfo {
  const savedFromPeerId = fwdFrom.savedFromPeer && getApiChatIdFromMtpPeer(fwdFrom.savedFromPeer);
  const fromId = fwdFrom.fromId && getApiChatIdFromMtpPeer(fwdFrom.fromId);

  return {
    date: fwdFrom.date,
    isImported: fwdFrom.imported,
    isChannelPost: Boolean(fwdFrom.channelPost),
    channelPostId: fwdFrom.channelPost,
    isLinkedChannelPost: Boolean(fwdFrom.channelPost && savedFromPeerId && !isChatWithSelf),
    fromChatId: savedFromPeerId || fromId,
    fromMessageId: fwdFrom.savedFromMsgId || fwdFrom.channelPost,
    senderUserId: fromId,
    hiddenUserName: fwdFrom.fromName,
    postAuthorTitle: fwdFrom.postAuthor,
  };
}

function buildSticker(media: GramJs.TypeMessageMedia): ApiSticker | undefined {
  if (
    !(media instanceof GramJs.MessageMediaDocument)
    || !media.document
    || !(media.document instanceof GramJs.Document)
  ) {
    return undefined;
  }

  return buildStickerFromDocument(media.document, media.nopremium);
}

function buildPhoto(media: GramJs.TypeMessageMedia): ApiPhoto | undefined {
  if (!(media instanceof GramJs.MessageMediaPhoto) || !media.photo || !(media.photo instanceof GramJs.Photo)) {
    return undefined;
  }

  return buildApiPhoto(media.photo, media.spoiler);
}

export function buildVideoFromDocument(document: GramJs.Document, isSpoiler?: boolean): ApiVideo | undefined {
  if (document instanceof GramJs.DocumentEmpty) {
    return undefined;
  }

  const {
    id, mimeType, thumbs, size, attributes,
  } = document;

  // eslint-disable-next-line no-restricted-globals
  if (mimeType === VIDEO_WEBM_TYPE && !(self as any).isWebmSupported) {
    return undefined;
  }

  // eslint-disable-next-line no-restricted-globals
  if (mimeType === VIDEO_MOV_TYPE && !(self as any).isMovSupported) {
    return undefined;
  }

  const videoAttr = attributes
    .find((a: any): a is GramJs.DocumentAttributeVideo => a instanceof GramJs.DocumentAttributeVideo);

  if (!videoAttr) {
    return undefined;
  }

  const gifAttr = attributes
    .find((a: any): a is GramJs.DocumentAttributeAnimated => a instanceof GramJs.DocumentAttributeAnimated);

  const {
    duration,
    w: width,
    h: height,
    supportsStreaming = false,
    roundMessage: isRound = false,
  } = videoAttr;

  return {
    id: String(id),
    mimeType,
    duration,
    fileName: getFilenameFromDocument(document, 'video'),
    width,
    height,
    supportsStreaming,
    isRound,
    isGif: Boolean(gifAttr),
    thumbnail: buildApiThumbnailFromStripped(thumbs),
    size: size.toJSNumber(),
    isSpoiler,
  };
}

function buildVideo(media: GramJs.TypeMessageMedia): ApiVideo | undefined {
  if (
    !(media instanceof GramJs.MessageMediaDocument)
    || !(media.document instanceof GramJs.Document)
    || !media.document.mimeType.startsWith('video')
  ) {
    return undefined;
  }

  return buildVideoFromDocument(media.document, media.spoiler);
}

function buildAudio(media: GramJs.TypeMessageMedia): ApiAudio | undefined {
  if (
    !(media instanceof GramJs.MessageMediaDocument)
    || !media.document
    || !(media.document instanceof GramJs.Document)
  ) {
    return undefined;
  }

  const audioAttribute = media.document.attributes
    .find((attr: any): attr is GramJs.DocumentAttributeAudio => (
      attr instanceof GramJs.DocumentAttributeAudio
    ));

  if (!audioAttribute || audioAttribute.voice) {
    return undefined;
  }

  const thumbnailSizes = media.document.thumbs && media.document.thumbs
    .filter((thumb): thumb is GramJs.PhotoSize => thumb instanceof GramJs.PhotoSize)
    .map((thumb) => buildApiPhotoSize(thumb));

  return {
    id: String(media.document.id),
    fileName: getFilenameFromDocument(media.document, 'audio'),
    thumbnailSizes,
    size: media.document.size.toJSNumber(),
    ...pick(media.document, ['mimeType']),
    ...pick(audioAttribute, ['duration', 'performer', 'title']),
  };
}

function buildVoice(media: GramJs.TypeMessageMedia): ApiVoice | undefined {
  if (
    !(media instanceof GramJs.MessageMediaDocument)
    || !media.document
    || !(media.document instanceof GramJs.Document)
  ) {
    return undefined;
  }

  const audioAttribute = media.document.attributes
    .find((attr: any): attr is GramJs.DocumentAttributeAudio => (
      attr instanceof GramJs.DocumentAttributeAudio
    ));

  if (!audioAttribute || !audioAttribute.voice) {
    return undefined;
  }

  const { duration, waveform } = audioAttribute;

  return {
    id: String(media.document.id),
    duration,
    waveform: waveform ? Array.from(waveform) : undefined,
  };
}

function buildDocumentFromMedia(media: GramJs.TypeMessageMedia) {
  if (!(media instanceof GramJs.MessageMediaDocument) || !media.document) {
    return undefined;
  }

  return buildApiDocument(media.document);
}

export function buildApiDocument(document: GramJs.TypeDocument): ApiDocument | undefined {
  if (!(document instanceof GramJs.Document)) {
    return undefined;
  }

  const {
    id, size, mimeType, date, thumbs, attributes,
  } = document;

  const photoSize = thumbs && thumbs.find((s: any): s is GramJs.PhotoSize => s instanceof GramJs.PhotoSize);
  let thumbnail = thumbs && buildApiThumbnailFromStripped(thumbs);
  if (!thumbnail && thumbs && photoSize) {
    const photoPath = thumbs.find((s: any): s is GramJs.PhotoPathSize => s instanceof GramJs.PhotoPathSize);
    if (photoPath) {
      thumbnail = buildApiThumbnailFromPath(photoPath, photoSize);
    }
  }

  let mediaType: ApiDocument['mediaType'] | undefined;
  let mediaSize: ApiDocument['mediaSize'] | undefined;
  if (photoSize) {
    mediaSize = {
      width: photoSize.w,
      height: photoSize.h,
    };

    if (SUPPORTED_IMAGE_CONTENT_TYPES.has(mimeType)) {
      mediaType = 'photo';

      const imageAttribute = attributes
        .find((a: any): a is GramJs.DocumentAttributeImageSize => a instanceof GramJs.DocumentAttributeImageSize);

      if (imageAttribute) {
        const { w: width, h: height } = imageAttribute;
        mediaSize = {
          width,
          height,
        };
      }
    } else if (SUPPORTED_VIDEO_CONTENT_TYPES.has(mimeType)) {
      mediaType = 'video';
      const videoAttribute = attributes
        .find((a: any): a is GramJs.DocumentAttributeVideo => a instanceof GramJs.DocumentAttributeVideo);

      if (videoAttribute) {
        const { w: width, h: height } = videoAttribute;
        mediaSize = {
          width,
          height,
        };
      }
    }
  }

  return {
    id: String(id),
    size: size.toJSNumber(),
    mimeType,
    timestamp: date,
    fileName: getFilenameFromDocument(document),
    thumbnail,
    mediaType,
    mediaSize,
  };
}

function buildContact(media: GramJs.TypeMessageMedia): ApiContact | undefined {
  if (!(media instanceof GramJs.MessageMediaContact)) {
    return undefined;
  }

  const {
    firstName, lastName, phoneNumber, userId,
  } = media;

  return {
    firstName, lastName, phoneNumber, userId: buildApiPeerId(userId, 'user'),
  };
}

function buildPollFromMedia(media: GramJs.TypeMessageMedia): ApiPoll | undefined {
  if (!(media instanceof GramJs.MessageMediaPoll)) {
    return undefined;
  }

  return buildPoll(media.poll, media.results);
}

function buildInvoiceFromMedia(media: GramJs.TypeMessageMedia): ApiInvoice | undefined {
  if (!(media instanceof GramJs.MessageMediaInvoice)) {
    return undefined;
  }

  return buildInvoice(media);
}

function buildLocationFromMedia(media: GramJs.TypeMessageMedia): ApiLocation | undefined {
  if (media instanceof GramJs.MessageMediaGeo) {
    return buildGeo(media);
  }

  if (media instanceof GramJs.MessageMediaVenue) {
    return buildVenue(media);
  }

  if (media instanceof GramJs.MessageMediaGeoLive) {
    return buildGeoLive(media);
  }

  return undefined;
}

function buildGeo(media: GramJs.MessageMediaGeo): ApiLocation | undefined {
  const point = buildGeoPoint(media.geo);
  return point && { type: 'geo', geo: point };
}

function buildVenue(media: GramJs.MessageMediaVenue): ApiLocation | undefined {
  const {
    geo, title, provider, address, venueId, venueType,
  } = media;
  const point = buildGeoPoint(geo);
  return point && {
    type: 'venue',
    geo: point,
    title,
    provider,
    address,
    venueId,
    venueType,
  };
}

function buildGeoLive(media: GramJs.MessageMediaGeoLive): ApiLocation | undefined {
  const { geo, period, heading } = media;
  const point = buildGeoPoint(geo);
  return point && {
    type: 'geoLive',
    geo: point,
    period,
    heading,
  };
}

function buildGeoPoint(geo: GramJs.TypeGeoPoint): ApiLocation['geo'] | undefined {
  if (geo instanceof GramJs.GeoPointEmpty) return undefined;
  const {
    long, lat, accuracyRadius, accessHash,
  } = geo;
  return {
    long,
    lat,
    accessHash: accessHash.toString(),
    accuracyRadius,
  };
}

function buildGameFromMedia(media: GramJs.TypeMessageMedia): ApiGame | undefined {
  if (!(media instanceof GramJs.MessageMediaGame)) {
    return undefined;
  }

  return buildGame(media);
}

function buildGame(media: GramJs.MessageMediaGame): ApiGame | undefined {
  const {
    id, accessHash, shortName, title, description, photo: apiPhoto, document: apiDocument,
  } = media.game;

  const photo = apiPhoto instanceof GramJs.Photo ? buildApiPhoto(apiPhoto) : undefined;
  const document = apiDocument instanceof GramJs.Document ? buildApiDocument(apiDocument) : undefined;

  return {
    id: id.toString(),
    accessHash: accessHash.toString(),
    shortName,
    title,
    description,
    photo,
    document,
  };
}

export function buildPoll(poll: GramJs.Poll, pollResults: GramJs.PollResults): ApiPoll {
  const { id, answers: rawAnswers } = poll;
  const answers = rawAnswers.map((answer) => ({
    text: answer.text,
    option: serializeBytes(answer.option),
  }));

  return {
    id: String(id),
    summary: {
      isPublic: poll.publicVoters,
      ...pick(poll, [
        'closed',
        'multipleChoice',
        'quiz',
        'question',
        'closePeriod',
        'closeDate',
      ]),
      answers,
    },
    results: buildPollResults(pollResults),
  };
}

export function buildInvoice(media: GramJs.MessageMediaInvoice): ApiInvoice {
  const {
    description: text, title, photo, test, totalAmount, currency, receiptMsgId, extendedMedia,
  } = media;

  const preview = extendedMedia instanceof GramJs.MessageExtendedMediaPreview
    ? buildApiMessageExtendedMediaPreview(extendedMedia) : undefined;

  return {
    title,
    text,
    photo: buildApiWebDocument(photo),
    receiptMsgId,
    amount: Number(totalAmount),
    currency,
    isTest: test,
    extendedMedia: preview,
  };
}

export function buildPollResults(pollResults: GramJs.PollResults): ApiPoll['results'] {
  const {
    results: rawResults, totalVoters, recentVoters, solution, solutionEntities: entities, min,
  } = pollResults;
  const results = rawResults?.map(({
    option, chosen, correct, voters,
  }) => ({
    isChosen: chosen,
    isCorrect: correct,
    option: serializeBytes(option),
    votersCount: voters,
  }));

  return {
    isMin: min,
    totalVoters,
    recentVoterIds: recentVoters?.map((peer) => getApiChatIdFromMtpPeer(peer)),
    results,
    solution,
    ...(entities && { solutionEntities: entities.map(buildApiMessageEntity) }),
  };
}

export function buildWebPage(media: GramJs.TypeMessageMedia): ApiWebPage | undefined {
  if (
    !(media instanceof GramJs.MessageMediaWebPage)
    || !(media.webpage instanceof GramJs.WebPage)
  ) {
    return undefined;
  }

  const { id, photo, document } = media.webpage;

  let video;
  if (document instanceof GramJs.Document && document.mimeType.startsWith('video/')) {
    video = buildVideoFromDocument(document);
  }

  return {
    id: Number(id),
    ...pick(media.webpage, [
      'url',
      'displayUrl',
      'type',
      'siteName',
      'title',
      'description',
      'duration',
    ]),
    photo: photo instanceof GramJs.Photo ? buildApiPhoto(photo) : undefined,
    document: !video && document ? buildApiDocument(document) : undefined,
    video,
  };
}

function buildAction(
  action: GramJs.TypeMessageAction,
  senderId: string | undefined,
  targetPeerId: string | undefined,
  isChannelPost: boolean,
  isOutgoing: boolean,
): ApiAction | undefined {
  if (action instanceof GramJs.MessageActionEmpty) {
    return undefined;
  }

  let phoneCall: PhoneCallAction | undefined;
  let call: Partial<ApiGroupCall> | undefined;
  let amount: number | undefined;
  let currency: string | undefined;
  let giftCryptoInfo: {
    currency: string;
    amount: string;
  } | undefined;
  let text: string;
  const translationValues: string[] = [];
  let type: ApiAction['type'] = 'other';
  let photo: ApiPhoto | undefined;
  let score: number | undefined;
  let months: number | undefined;
  let topicEmojiIconId: string | undefined;
  let isTopicAction: boolean | undefined;

  const targetUserIds = 'users' in action
    ? action.users && action.users.map((id) => buildApiPeerId(id, 'user'))
    : ('userId' in action && [buildApiPeerId(action.userId, 'user')]) || [];
  let targetChatId: string | undefined;

  if (action instanceof GramJs.MessageActionChatCreate) {
    text = 'Notification.CreatedChatWithTitle';
    translationValues.push('%action_origin%', action.title);
    type = 'chatCreate';
  } else if (action instanceof GramJs.MessageActionChatEditTitle) {
    if (isChannelPost) {
      text = 'Channel.MessageTitleUpdated';
      translationValues.push(action.title);
    } else {
      text = 'Notification.ChangedGroupName';
      translationValues.push('%action_origin%', action.title);
    }
  } else if (action instanceof GramJs.MessageActionChatEditPhoto) {
    if (isChannelPost) {
      text = 'Channel.MessagePhotoUpdated';
    } else {
      text = 'Notification.ChangedGroupPhoto';
      translationValues.push('%action_origin%');
    }
  } else if (action instanceof GramJs.MessageActionChatDeletePhoto) {
    if (isChannelPost) {
      text = 'Channel.MessagePhotoRemoved';
    } else {
      text = 'Group.MessagePhotoRemoved';
    }
  } else if (action instanceof GramJs.MessageActionChatAddUser) {
    if (!senderId || targetUserIds.includes(senderId)) {
      text = 'Notification.JoinedChat';
      translationValues.push('%target_user%');
    } else {
      text = 'Notification.Invited';
      translationValues.push('%action_origin%', '%target_user%');
    }
  } else if (action instanceof GramJs.MessageActionChatDeleteUser) {
    if (!senderId || targetUserIds.includes(senderId)) {
      text = 'Notification.LeftChat';
      translationValues.push('%target_user%');
    } else {
      text = 'Notification.Kicked';
      translationValues.push('%action_origin%', '%target_user%');
    }
  } else if (action instanceof GramJs.MessageActionChatJoinedByLink) {
    text = 'Notification.JoinedGroupByLink';
    translationValues.push('%action_origin%');
  } else if (action instanceof GramJs.MessageActionChannelCreate) {
    text = 'Notification.CreatedChannel';
  } else if (action instanceof GramJs.MessageActionChatMigrateTo) {
    targetChatId = getApiChatIdFromMtpPeer(action);
    text = 'Migrated to %target_chat%';
    translationValues.push('%target_chat%');
  } else if (action instanceof GramJs.MessageActionChannelMigrateFrom) {
    targetChatId = getApiChatIdFromMtpPeer(action);
    text = 'Migrated from %target_chat%';
    translationValues.push('%target_chat%');
  } else if (action instanceof GramJs.MessageActionPinMessage) {
    text = 'Chat.Service.Group.UpdatedPinnedMessage1';
    translationValues.push('%action_origin%', '%message%');
  } else if (action instanceof GramJs.MessageActionHistoryClear) {
    text = 'HistoryCleared';
    type = 'historyClear';
  } else if (action instanceof GramJs.MessageActionPhoneCall) {
    const withDuration = Boolean(action.duration);
    text = [
      withDuration ? 'ChatList.Service' : 'Chat',
      action.video ? 'VideoCall' : 'Call',
      isOutgoing ? (withDuration ? 'outgoing' : 'Outgoing') : (withDuration ? 'incoming' : 'Incoming'),
    ].join('.');

    if (withDuration) {
      const mins = Math.max(Math.round(action.duration! / 60), 1);
      translationValues.push(`${mins} min${mins > 1 ? 's' : ''}`);
    }

    phoneCall = {
      isOutgoing,
      isVideo: action.video,
      duration: action.duration,
      reason: buildApiCallDiscardReason(action.reason),
    };
  } else if (action instanceof GramJs.MessageActionInviteToGroupCall) {
    text = 'Notification.VoiceChatInvitation';
    call = {
      id: action.call.id.toString(),
      accessHash: action.call.accessHash.toString(),
    };
    translationValues.push('%action_origin%', '%target_user%');
  } else if (action instanceof GramJs.MessageActionContactSignUp) {
    text = 'Notification.Joined';
    translationValues.push('%action_origin%');
    type = 'contactSignUp';
  } else if (action instanceof GramJs.MessageActionPaymentSent) {
    amount = Number(action.totalAmount);
    currency = action.currency;
    text = 'PaymentSuccessfullyPaid';
    if (targetPeerId) {
      targetUserIds.push(targetPeerId);
    }
    translationValues.push('%payment_amount%', '%target_user%', '%product%');
  } else if (action instanceof GramJs.MessageActionGroupCall) {
    if (action.duration) {
      const mins = Math.max(Math.round(action.duration / 60), 1);
      text = 'Notification.VoiceChatEnded';
      translationValues.push(`${mins} min${mins > 1 ? 's' : ''}`);
    } else {
      text = 'Notification.VoiceChatStartedChannel';
      call = {
        id: action.call.id.toString(),
        accessHash: action.call.accessHash.toString(),
      };
    }
  } else if (action instanceof GramJs.MessageActionBotAllowed) {
    if (action.domain) {
      text = 'ActionBotAllowed';
      translationValues.push(action.domain);
    } else {
      text = 'ActionAttachMenuBotAllowed';
    }
  } else if (action instanceof GramJs.MessageActionCustomAction) {
    text = action.message;
  } else if (action instanceof GramJs.MessageActionChatJoinedByRequest) {
    text = 'ChatService.UserJoinedGroupByRequest';
    translationValues.push('%action_origin%');
  } else if (action instanceof GramJs.MessageActionGameScore) {
    text = senderId === currentUserId ? 'ActionYouScoredInGame' : 'ActionUserScoredInGame';
    translationValues.push('%score%');
    score = action.score;
  } else if (action instanceof GramJs.MessageActionWebViewDataSent) {
    text = 'Notification.WebAppSentData';
    translationValues.push(action.text);
  } else if (action instanceof GramJs.MessageActionGiftPremium) {
    text = isOutgoing ? 'ActionGiftOutbound' : 'ActionGiftInbound';
    if (isOutgoing) {
      translationValues.push('%gift_payment_amount%');
    } else {
      translationValues.push('%action_origin%', '%gift_payment_amount%');
    }
    if (targetPeerId) {
      targetUserIds.push(targetPeerId);
    }
    currency = action.currency;
    if (action.cryptoCurrency) {
      const cryptoAmountWithDecimals = action.cryptoAmount!.divide(1e7).toJSNumber() / 100;
      giftCryptoInfo = {
        currency: action.cryptoCurrency,
        amount: cryptoAmountWithDecimals.toFixed(2),
      };
    }
    amount = action.amount.toJSNumber();
    months = action.months;
  } else if (action instanceof GramJs.MessageActionTopicCreate) {
    text = 'TopicWasCreatedAction';
    type = 'topicCreate';
    translationValues.push(action.title);
  } else if (action instanceof GramJs.MessageActionTopicEdit) {
    if (action.closed !== undefined) {
      text = action.closed ? 'TopicWasClosedAction' : 'TopicWasReopenedAction';
      translationValues.push('%action_origin%', '%action_topic%');
    } else if (action.hidden !== undefined) {
      text = action.hidden ? 'TopicHidden2' : 'TopicShown';
    } else if (action.title) {
      text = 'TopicRenamedTo';
      translationValues.push('%action_origin%', action.title);
    } else if (action.iconEmojiId) {
      text = 'TopicWasIconChangedToAction';
      translationValues.push('%action_origin%', '%action_topic_icon%');
      topicEmojiIconId = action.iconEmojiId.toString();
    } else {
      text = 'ChatList.UnsupportedMessage';
    }
    isTopicAction = true;
  } else if (action instanceof GramJs.MessageActionSuggestProfilePhoto) {
    const isVideo = action.photo instanceof GramJs.Photo && action.photo.videoSizes?.length;
    text = senderId === currentUserId
      ? (isVideo ? 'ActionSuggestVideoFromYouDescription' : 'ActionSuggestPhotoFromYouDescription')
      : (isVideo ? 'ActionSuggestVideoToYouDescription' : 'ActionSuggestPhotoToYouDescription');
    type = 'suggestProfilePhoto';
    translationValues.push('%target_user%');

    if (targetPeerId) targetUserIds.push(targetPeerId);
  } else {
    text = 'ChatList.UnsupportedMessage';
  }

  if ('photo' in action && action.photo instanceof GramJs.Photo) {
    addPhotoToLocalDb(action.photo);
    photo = buildApiPhoto(action.photo);
  }

  return {
    text,
    type,
    targetUserIds,
    targetChatId,
    photo, // TODO Only used internally now, will be used for the UI in future
    amount,
    currency,
    giftCryptoInfo,
    translationValues,
    call,
    phoneCall,
    score,
    months,
    topicEmojiIconId,
    isTopicAction,
  };
}

function buildReplyButtons(message: UniversalMessage, shouldSkipBuyButton?: boolean): ApiReplyKeyboard | undefined {
  const { replyMarkup, media } = message;

  if (!(replyMarkup instanceof GramJs.ReplyKeyboardMarkup || replyMarkup instanceof GramJs.ReplyInlineMarkup)) {
    return undefined;
  }

  const markup = replyMarkup.rows.map(({ buttons }) => {
    return buttons.map((button): ApiKeyboardButton | undefined => {
      const { text } = button;

      if (button instanceof GramJs.KeyboardButton) {
        return {
          type: 'command',
          text,
        };
      }

      if (button instanceof GramJs.KeyboardButtonUrl) {
        if (button.url.includes('?startgroup=')) {
          return {
            type: 'unsupported',
            text,
          };
        }

        return {
          type: 'url',
          text,
          url: button.url,
        };
      }

      if (button instanceof GramJs.KeyboardButtonCallback) {
        if (button.requiresPassword) {
          return {
            type: 'unsupported',
            text,
          };
        }

        return {
          type: 'callback',
          text,
          data: serializeBytes(button.data),
        };
      }

      if (button instanceof GramJs.KeyboardButtonRequestPoll) {
        return {
          type: 'requestPoll',
          text,
          isQuiz: button.quiz,
        };
      }

      if (button instanceof GramJs.KeyboardButtonRequestPhone) {
        return {
          type: 'requestPhone',
          text,
        };
      }

      if (button instanceof GramJs.KeyboardButtonBuy) {
        if (media instanceof GramJs.MessageMediaInvoice && media.receiptMsgId) {
          return {
            type: 'receipt',
            text: 'PaymentReceipt',
            receiptMessageId: media.receiptMsgId,
          };
        }
        if (shouldSkipBuyButton) return undefined;
        return {
          type: 'buy',
          text,
        };
      }

      if (button instanceof GramJs.KeyboardButtonGame) {
        return {
          type: 'game',
          text,
        };
      }

      if (button instanceof GramJs.KeyboardButtonSwitchInline) {
        return {
          type: 'switchBotInline',
          text,
          query: button.query,
          isSamePeer: button.samePeer,
        };
      }

      if (button instanceof GramJs.KeyboardButtonUserProfile) {
        return {
          type: 'userProfile',
          text,
          userId: button.userId.toString(),
        };
      }

      if (button instanceof GramJs.KeyboardButtonSimpleWebView) {
        return {
          type: 'simpleWebView',
          text,
          url: button.url,
        };
      }

      if (button instanceof GramJs.KeyboardButtonWebView) {
        return {
          type: 'webView',
          text,
          url: button.url,
        };
      }

      if (button instanceof GramJs.KeyboardButtonUrlAuth) {
        return {
          type: 'urlAuth',
          text,
          url: button.url,
          buttonId: button.buttonId,
        };
      }

      return {
        type: 'unsupported',
        text,
      };
    }).filter(Boolean);
  });

  if (markup.every((row) => !row.length)) return undefined;

  return {
    [replyMarkup instanceof GramJs.ReplyKeyboardMarkup ? 'keyboardButtons' : 'inlineButtons']: markup,
    ...(replyMarkup instanceof GramJs.ReplyKeyboardMarkup && {
      keyboardPlaceholder: replyMarkup.placeholder,
      isKeyboardSingleUse: replyMarkup.singleUse,
      isKeyboardSelective: replyMarkup.selective,
    }),
  };
}

function getFilenameFromDocument(document: GramJs.Document, defaultBase = 'file') {
  const { mimeType, attributes } = document;
  const filenameAttribute = attributes
    .find((a: any): a is GramJs.DocumentAttributeFilename => a instanceof GramJs.DocumentAttributeFilename);

  if (filenameAttribute) {
    return filenameAttribute.fileName;
  }

  const extension = mimeType.split('/')[1];

  return `${defaultBase}${String(document.id)}.${extension}`;
}

export function buildLocalMessage(
  chat: ApiChat,
  text?: string,
  entities?: ApiMessageEntity[],
  replyingTo?: number,
  replyingToTopId?: number,
  attachment?: ApiAttachment,
  sticker?: ApiSticker,
  gif?: ApiVideo,
  poll?: ApiNewPoll,
  contact?: ApiContact,
  groupedId?: string,
  scheduledAt?: number,
  sendAs?: ApiChat | ApiUser,
): ApiMessage {
  const localId = getNextLocalMessageId(chat.lastMessage?.id);
  const media = attachment && buildUploadingMedia(attachment);
  const isChannel = chat.type === 'chatTypeChannel';
  const isForum = chat.isForum;

  const message = {
    id: localId,
    chatId: chat.id,
    content: {
      ...(text && {
        text: {
          text,
          entities,
        },
      }),
      ...media,
      ...(sticker && { sticker }),
      ...(gif && { video: gif }),
      ...(poll && buildNewPoll(poll, localId)),
      ...(contact && { contact }),
    },
    date: scheduledAt || Math.round(Date.now() / 1000) + getServerTimeOffset(),
    isOutgoing: !isChannel,
    senderId: sendAs?.id || currentUserId,
    ...(replyingTo && { replyToMessageId: replyingTo }),
    ...(replyingToTopId && { replyToTopMessageId: replyingToTopId }),
    ...((replyingTo || replyingToTopId) && isForum && { isTopicReply: true }),
    ...(groupedId && {
      groupedId,
      ...(media && (media.photo || media.video) && { isInAlbum: true }),
    }),
    ...(scheduledAt && { isScheduled: true }),
    isForwardingAllowed: true,
  } satisfies ApiMessage;

  const emojiOnlyCount = getEmojiOnlyCountForMessage(message.content, message.groupedId);

  return {
    ...message,
    ...(emojiOnlyCount && { emojiOnlyCount }),
  };
}

export function buildLocalForwardedMessage({
  toChat,
  toThreadId,
  message,
  scheduledAt,
  noAuthors,
  noCaptions,
  isCurrentUserPremium,
}: {
  toChat: ApiChat;
  toThreadId?: number;
  message: ApiMessage;
  scheduledAt?: number;
  noAuthors?: boolean;
  noCaptions?: boolean;
  isCurrentUserPremium?: boolean;
}): ApiMessage {
  const localId = getNextLocalMessageId(toChat?.lastMessage?.id);
  const {
    content,
    chatId: fromChatId,
    id: fromMessageId,
    senderId,
    groupedId,
    isInAlbum,
  } = message;

  const isAudio = content.audio;
  const asIncomingInChatWithSelf = (
    toChat.id === currentUserId && (fromChatId !== toChat.id || message.forwardInfo) && !isAudio
  );
  const shouldHideText = Object.keys(content).length > 1 && content.text && noCaptions;
  const shouldDropCustomEmoji = !isCurrentUserPremium;
  const strippedText = content.text?.entities && shouldDropCustomEmoji ? {
    text: content.text.text,
    entities: content.text.entities.filter((entity) => entity.type !== ApiMessageEntityTypes.CustomEmoji),
  } : content.text;
  const emojiOnlyCount = getEmojiOnlyCountForMessage(content, groupedId);

  const updatedContent = {
    ...content,
    text: !shouldHideText ? strippedText : undefined,
  };

  return {
    id: localId,
    chatId: toChat.id,
    content: updatedContent,
    date: scheduledAt || Math.round(Date.now() / 1000) + getServerTimeOffset(),
    isOutgoing: !asIncomingInChatWithSelf && toChat.type !== 'chatTypeChannel',
    senderId: currentUserId,
    sendingState: 'messageSendingStatePending',
    groupedId,
    isInAlbum,
    isForwardingAllowed: true,
    replyToTopMessageId: toThreadId,
    ...(toThreadId && toChat?.isForum && { isTopicReply: true }),

    ...(emojiOnlyCount && { emojiOnlyCount }),
    // Forward info doesn't get added when users forwards his own messages, also when forwarding audio
    ...(message.chatId !== currentUserId && !isAudio && !noAuthors && {
      forwardInfo: {
        date: message.date,
        isChannelPost: false,
        fromChatId,
        fromMessageId,
        senderUserId: senderId,
      },
    }),
    ...(message.chatId === currentUserId && !noAuthors && { forwardInfo: message.forwardInfo }),
    ...(scheduledAt && { isScheduled: true }),
  };
}

function buildUploadingMedia(
  attachment: ApiAttachment,
): ApiMessage['content'] {
  const {
    filename: fileName,
    blobUrl,
    previewBlobUrl,
    mimeType,
    size,
    audio,
    shouldSendAsFile,
    shouldSendAsSpoiler,
  } = attachment;

  if (!shouldSendAsFile) {
    if (attachment.quick) {
      // TODO Handle GIF as video, but support playback in <video>
      if (SUPPORTED_IMAGE_CONTENT_TYPES.has(mimeType)) {
        const { width, height } = attachment.quick;
        return {
          photo: {
            id: LOCAL_MEDIA_UPLOADING_TEMP_ID,
            sizes: [],
            thumbnail: { width, height, dataUri: previewBlobUrl || blobUrl },
            blobUrl,
            isSpoiler: shouldSendAsSpoiler,
          },
        };
      }
      if (SUPPORTED_VIDEO_CONTENT_TYPES.has(mimeType)) {
        const { width, height, duration } = attachment.quick;
        return {
          video: {
            id: LOCAL_MEDIA_UPLOADING_TEMP_ID,
            mimeType,
            duration: duration || 0,
            fileName,
            width,
            height,
            blobUrl,
            ...(previewBlobUrl && { thumbnail: { width, height, dataUri: previewBlobUrl } }),
            size,
            isSpoiler: shouldSendAsSpoiler,
          },
        };
      }
    }
    if (attachment.voice) {
      const { duration, waveform } = attachment.voice;
      const { data: inputWaveform } = interpolateArray(waveform, INPUT_WAVEFORM_LENGTH);
      return {
        voice: {
          id: LOCAL_MEDIA_UPLOADING_TEMP_ID,
          duration,
          waveform: inputWaveform,
        },
      };
    }
    if (SUPPORTED_AUDIO_CONTENT_TYPES.has(mimeType)) {
      const { duration, performer, title } = audio || {};
      return {
        audio: {
          id: LOCAL_MEDIA_UPLOADING_TEMP_ID,
          mimeType,
          fileName,
          size,
          duration: duration || 0,
          title,
          performer,
        },
      };
    }
  }
  return {
    document: {
      mimeType,
      fileName,
      size,
      ...(previewBlobUrl && { previewBlobUrl }),
    },
  };
}

export function buildApiMessageExtendedMediaPreview(
  preview: GramJs.MessageExtendedMediaPreview,
): ApiMessageExtendedMediaPreview {
  const {
    w, h, thumb, videoDuration,
  } = preview;

  return {
    width: w,
    height: h,
    duration: videoDuration,
    thumbnail: thumb ? buildApiThumbnailFromStripped([thumb]) : undefined,
  };
}

export function buildApiWebDocument(document?: GramJs.TypeWebDocument): ApiWebDocument | undefined {
  if (!document) return undefined;

  const {
    url, size, mimeType,
  } = document;
  const accessHash = document instanceof GramJs.WebDocument ? document.accessHash.toString() : undefined;
  const sizeAttr = document.attributes.find((attr): attr is GramJs.DocumentAttributeImageSize => (
    attr instanceof GramJs.DocumentAttributeImageSize
  ));
  const dimensions = sizeAttr && { width: sizeAttr.w, height: sizeAttr.h };

  return {
    url,
    accessHash,
    size,
    mimeType,
    dimensions,
  };
}

function buildNewPoll(poll: ApiNewPoll, localId: number) {
  return {
    poll: {
      id: String(localId),
      summary: pick(poll.summary, ['question', 'answers']),
      results: {},
    },
  };
}

export function buildApiMessageEntity(entity: GramJs.TypeMessageEntity): ApiMessageEntity {
  const {
    className: type, offset, length,
  } = entity;

  if (entity instanceof GramJs.MessageEntityMentionName) {
    return {
      type: ApiMessageEntityTypes.MentionName,
      offset,
      length,
      userId: buildApiPeerId(entity.userId, 'user'),
    };
  }

  if (entity instanceof GramJs.MessageEntityTextUrl) {
    return {
      type: ApiMessageEntityTypes.TextUrl,
      offset,
      length,
      url: entity.url,
    };
  }

  if (entity instanceof GramJs.MessageEntityPre) {
    return {
      type: ApiMessageEntityTypes.Pre,
      offset,
      length,
      language: entity.language,
    };
  }

  if (entity instanceof GramJs.MessageEntityCustomEmoji) {
    return {
      type: ApiMessageEntityTypes.CustomEmoji,
      offset,
      length,
      documentId: entity.documentId.toString(),
    };
  }

  return {
    type: type as `${ApiMessageEntityDefault['type']}`,
    offset,
    length,
  };
}

function buildThreadInfo(
  messageReplies: GramJs.TypeMessageReplies, messageId: number, chatId: string,
): ApiThreadInfo | undefined {
  const {
    channelId, replies, maxId, readMaxId, recentRepliers, comments,
  } = messageReplies;

  const apiChannelId = channelId ? buildApiPeerId(channelId, 'channel') : undefined;
  if (apiChannelId === DELETED_COMMENTS_CHANNEL_ID) {
    return undefined;
  }

  const isPostThread = apiChannelId && chatId !== apiChannelId;

  return {
    isComments: comments,
    threadId: messageId,
    ...(isPostThread ? {
      chatId: apiChannelId,
      originChannelId: chatId,
    } : {
      chatId,
    }),
    messagesCount: replies,
    lastMessageId: maxId,
    lastReadInboxMessageId: readMaxId,
    ...(recentRepliers && { recentReplierIds: recentRepliers.map(getApiChatIdFromMtpPeer) }),
  };
}

export function buildApiFormattedText(textWithEntities: GramJs.TextWithEntities): ApiFormattedText {
  const { text, entities } = textWithEntities;

  return {
    text,
    entities: entities.map(buildApiMessageEntity),
  };
}
