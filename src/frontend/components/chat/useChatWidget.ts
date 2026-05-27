"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useSocket } from "@/frontend/context/SocketContext";
import { useLanguage } from "@/context/LanguageContext";
import {
    getOrCreateMyConversation,
    getConversationMessages,
    markAsRead,
    deleteConversationAction,
    getOrCreateConversationForAdmin,
} from "@/backend/modules/chat/chat.actions";
import { SignalService } from "@/frontend/lib/signalService";
import { signalStore } from "@/frontend/lib/signalStore";
import { config } from "@/config/config";
import logger from "@/utils/logger";
import type { Message } from "./ChatWidget";

const log = logger.child("src/frontend/components/chat/useChatWidget.ts");

export function useChatWidget(forceShow: boolean, targetUserId?: string) {
    const { data: session, status } = useSession();
    const isAdminUser = session?.user?.role === "admin";
    const chatUserId = session?.user?.id;
    const { socket, isConnected } = useSocket();
    const { language } = useLanguage();

    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<any>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isAdminTyping, setIsAdminTyping] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
    const [isE2EEReady, setIsE2EEReady] = useState(false);
    const [viewportHeight, setViewportHeight] = useState("100vh");
    const [targetUserName, setTargetUserName] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const firstUnreadRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const hasNewKeysRef = useRef(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const messagesScrollRef = useRef<HTMLDivElement>(null);
    const hasInitialScrolledRef = useRef(false);
    const isOpenRef = useRef(isOpen);

    // ── Translations ─────────────────────────────────────────────────
    const t = {
        es: {
            title: `Soporte ${config.app.name}`,
            online: "En línea",
            offline: "Desconectado",
            placeholder: "Escribe tu mensaje...",
            noMessages: "¡Hola! ¿En qué podemos ayudarte hoy?",
            loginRequired: "Por favor, inicia sesión para chatear con soporte.",
            loginBtn: "Iniciar Sesión",
            typing: "El administrador está escribiendo...",
            clearConfirmTitle: "¿Limpiar historial?",
            clearConfirmDesc: "Esta acción vaciará toda la conversación y no se podrá deshacer.",
            clearConfirmBtn: "Vaciar",
            cancelBtn: "Cancelar",
            tooltipClear: "Limpiar chat",
            disconnectedWarning: "Servidor de chat desconectado. Reconectando...",
            disconnectedPlaceholder: "Desconectado...",
            replyingTo: "Respondiendo a",
        },
        en: {
            title: `${config.app.name} Support`,
            online: "Online",
            offline: "Offline",
            placeholder: "Type your message...",
            noMessages: "Hi! How can we help you today?",
            loginRequired: "Please log in to chat with support.",
            loginBtn: "Log In",
            typing: "Support is typing...",
            clearConfirmTitle: "Clear history?",
            clearConfirmDesc: "This will empty all of your conversation history and cannot be undone.",
            clearConfirmBtn: "Clear",
            cancelBtn: "Cancel",
            tooltipClear: "Clear chat",
            disconnectedWarning: "Chat server disconnected. Reconnecting...",
            disconnectedPlaceholder: "Disconnected...",
            replyingTo: "Replying to",
        },
    }[language === "es" ? "es" : "en"];

    // ── Effects ───────────────────────────────────────────────────────

    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        isOpenRef.current = isOpen;
    }, [isOpen]);

    useEffect(() => {
        hasInitialScrolledRef.current = false;
    }, [isOpen, conversation?.id]);

    // Lock body scroll when chat is open on mobile
    useEffect(() => {
        if (!isOpen || typeof window === "undefined" || window.innerWidth >= 768) return;

        const body = document.body;
        const originalBodyOverflow = body.style.overflow;
        
        body.style.overflow = "hidden";

        return () => {
            body.style.overflow = originalBodyOverflow;
        };
    }, [isOpen]);

    // Prevent touchmove on non-scrollable areas
    useEffect(() => {
        if (!isOpen || typeof window === "undefined" || window.innerWidth >= 768) return;
        const container = chatContainerRef.current;
        if (!container) return;
        const handleTouchMove = (e: TouchEvent) => {
            const scrollable = messagesScrollRef.current;
            if (scrollable && scrollable.contains(e.target as Node)) return;
            e.preventDefault();
        };
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        return () => container.removeEventListener("touchmove", handleTouchMove);
    }, [isOpen]);

    // Initialize E2EE
    useEffect(() => {
        const isRouteAdmin = isClient && window.location.pathname.startsWith("/admin");
        if (status !== "authenticated" || !chatUserId) return;
        if (!forceShow && (isRouteAdmin || isAdminUser)) return;
        const initE2EE = async () => {
            try {
                signalStore.setUserId(chatUserId);
                const didRegister = await SignalService.registerDevice();
                if (didRegister) hasNewKeysRef.current = true;
                setIsE2EEReady(config.chat.enableE2EE);
            } catch (err) {
                log.error("Fallo al inicializar Signal E2EE:", err);
            }
        };
        initE2EE();
    }, [chatUserId, status, isClient, isAdminUser, forceShow]);

    // Fetch target user name placeholder
    useEffect(() => {
        if (!isAdminUser || !targetUserId) { setTargetUserName(null); return; }
        setTargetUserName("Cargando...");
    }, [isAdminUser, targetUserId]);

    // Load conversation and messages
    useEffect(() => {
        const isRouteAdmin = isClient && window.location.pathname.startsWith("/admin");
        if (!chatUserId) return;
        if (!forceShow && (isRouteAdmin || isAdminUser)) return;

        let isCancelled = false;
        const initChat = async () => {
            if (isOpen && messages.length === 0) setIsLoading(true);
            try {
                signalStore.setUserId(chatUserId);
                const res = (isAdminUser && targetUserId)
                    ? await getOrCreateConversationForAdmin(targetUserId)
                    : await getOrCreateMyConversation();

                if (isCancelled) return;
                if (res && !("error" in res)) {
                    setConversation(res);
                    if (isAdminUser && targetUserId && res.user) {
                        setTargetUserName(res.user.name || targetUserId);
                    }
                    const msgsRes = await getConversationMessages(res.id);
                    if (isCancelled) return;
                    if (msgsRes && !("error" in msgsRes)) {
                        const decryptedMsgs = await Promise.all(msgsRes.map(async (m: Message) => {
                            let decryptedContent = m.content;
                            let decryptedReplyContent = m.replyTo?.content;

                            if (m.isEncrypted) {
                                try {
                                    const targetId = (isAdminUser && targetUserId)
                                        ? targetUserId
                                        : (m.senderId === chatUserId ? "admin" : m.senderId);
                                    decryptedContent = await SignalService.decryptMessage(targetId, m.content, m.encryptionType || 1);
                                } catch { decryptedContent = "🔒 Mensaje de otra sesión"; }
                            }
                            if (m.replyTo && m.replyTo.isEncrypted && m.replyTo.content) {
                                try {
                                    const replyTargetId = (isAdminUser && targetUserId)
                                        ? targetUserId
                                        : (m.replyTo.senderId === chatUserId ? "admin" : m.replyTo.senderId);
                                    decryptedReplyContent = await SignalService.decryptMessage(replyTargetId, m.replyTo.content, m.replyTo.encryptionType || 1);
                                } catch { decryptedReplyContent = "🔒 Mensaje de otra sesión"; }
                            }
                            return {
                                ...m,
                                content: decryptedContent,
                                replyTo: m.replyTo ? { ...m.replyTo, content: decryptedReplyContent || "" } : null,
                            };
                        }));

                        if (!isCancelled) {
                            setMessages(decryptedMsgs);
                            if (isOpen) {
                                await markAsRead(res.id);
                                setUnreadCount(0);
                            } else {
                                const unread = msgsRes.filter((m: Message) => !m.isRead && m.senderRole === "admin").length;
                                setUnreadCount(unread);
                            }
                        }
                    }
                }
            } catch (err) {
                log.error("Error preloading conversation:", err);
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };
        initChat();
        return () => { isCancelled = true; };
    }, [chatUserId, isClient, isAdminUser, isOpen, forceShow]);

    // WebSocket events
    useEffect(() => {
        const isRouteAdmin = isClient && window.location.pathname.startsWith("/admin");
        if (!socket || !conversation?.id) return;
        if (!forceShow && (isRouteAdmin || isAdminUser)) return;

        socket.emit("join_room", { conversationId: conversation.id });

        if (hasNewKeysRef.current && chatUserId) {
            log.info("Emitting request_key_sync due to new device registration");
            socket.emit("request_key_sync", { conversationId: conversation.id, userId: chatUserId });
            hasNewKeysRef.current = false;
        }

        const handleKeySyncNeeded = async ({ userId }: { userId: string }) => {
            if (userId !== chatUserId) {
                log.info(`Clearing E2EE session for ${userId} because they changed device/key`);
                await signalStore.removeSession(userId);
                try {
                    const bundle = await SignalService.fetchBundle(userId);
                    const encoder = new TextEncoder();
                    await signalStore.storeSession(userId, encoder.encode(bundle.signedPreKey.publicKey));
                    log.info(`Successfully updated E2EE key for ${userId}`);
                } catch (e) {
                    log.error(`Failed to refresh key for ${userId} during sync:`, e);
                }
            }
        };

        const handleReceiveMessage = async (message: Message) => {
            if (message.conversationId !== conversation.id) return;
            const finalMessage = { ...message };

            if (message.isEncrypted) {
                try {
                    const targetId = (isAdminUser && targetUserId)
                        ? targetUserId
                        : (message.senderId === chatUserId ? "admin" : message.senderId);
                    finalMessage.content = await SignalService.decryptMessage(targetId, message.content, message.encryptionType || 1);
                } catch { finalMessage.content = "🔒 Mensaje de otra sesión"; }
            }
            if (message.replyTo && message.replyTo.isEncrypted && message.replyTo.content) {
                try {
                    const replyTargetId = (isAdminUser && targetUserId)
                        ? targetUserId
                        : (message.replyTo.senderId === chatUserId ? "admin" : message.replyTo.senderId);
                    finalMessage.replyTo = {
                        ...message.replyTo,
                        content: await SignalService.decryptMessage(replyTargetId, message.replyTo.content, message.replyTo.encryptionType || 1),
                    };
                } catch {
                    finalMessage.replyTo = { ...message.replyTo, content: "🔒 Mensaje de otra sesión" };
                }
            }

            setMessages((prev) => {
                if (prev.some((m) => m.id === finalMessage.id)) return prev;
                return [...prev, finalMessage];
            });
            if (isOpenRef.current) {
                markAsRead(conversation.id);
            } else if (message.senderRole === "admin") {
                setUnreadCount((prev) => prev + 1);
            }
        };

        const handleUserTyping = ({ senderId, isTyping }: { senderId: string; isTyping: boolean }) => {
            if (senderId !== chatUserId) setIsAdminTyping(isTyping);
        };

        const handleConversationDeleted = ({ conversationId }: { conversationId: string }) => {
            if (conversation?.id === conversationId) {
                setMessages([]);
                setConversation(null);
                setIsOpen(false);
                setUnreadCount(0);
            }
        };

        socket.on("receive_message", handleReceiveMessage);
        socket.on("user_typing", handleUserTyping);
        socket.on("conversation_deleted", handleConversationDeleted);
        socket.on("key_sync_needed", handleKeySyncNeeded);

        return () => {
            socket.emit("leave_room", { conversationId: conversation.id });
            socket.off("receive_message", handleReceiveMessage);
            socket.off("user_typing", handleUserTyping);
            socket.off("conversation_deleted", handleConversationDeleted);
            socket.off("key_sync_needed", handleKeySyncNeeded);
        };
    }, [socket, conversation?.id, chatUserId, isClient, isAdminUser, forceShow]);

    // Scroll management
    useEffect(() => {
        if (isLoading || messages.length === 0 || !isOpen) return;
        const timer = setTimeout(() => {
            const container = messagesScrollRef.current;
            if (!container) return;
            if (!hasInitialScrolledRef.current) {
                if (firstUnreadRef.current) {
                    const element = firstUnreadRef.current;
                    const containerRect = container.getBoundingClientRect();
                    const elementRect = element.getBoundingClientRect();
                    const relativeTop = elementRect.top - containerRect.top + container.scrollTop;
                    const targetScrollTop = relativeTop - (containerRect.height / 2) + (elementRect.height / 2);
                    container.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
                } else {
                    container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
                }
                hasInitialScrolledRef.current = true;
            } else {
                container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isAdminTyping, isLoading, isOpen]);

    // Advisor message event listener
    useEffect(() => {
        const handleAdvisorMessageEvent = async (e: Event) => {
            const customEvent = e as CustomEvent;
            const { pedidoId, pedidoIds, cart, totalPrice, values } = customEvent.detail;
            const orderIds = Array.isArray(pedidoIds) && pedidoIds.length > 0 ? pedidoIds : [pedidoId];

            if (!socket || !conversation?.id || !session?.user?.id) {
                log.warn("No se puede enviar el mensaje de asesor: chat no inicializado");
                return;
            }

            let content = `¡Hola! Estoy a la espera de un asesor para tomar mi pedido.\n\n`;
            content += `DETALLES DEL PEDIDO\n`;
            content += `===================\n\n`;
            if (cart && Array.isArray(cart)) {
                content += `CANTIDAD\tPRODUCTO\t\tPRECIO UNIT.\tSUBTOTAL\n`;
                content += `--------\t--------\t\t------------\t--------\n`;
                let totalCalculado = 0;
                cart.forEach((item: any) => {
                    const itemName = item.product?.name || item.name || "Producto";
                    const precioUnitario = item.product?.price || 0;
                    const subtotal = item.quantity * precioUnitario;
                    totalCalculado += subtotal;
                    content += `${item.quantity}\t\t${itemName}\t\t$${precioUnitario.toLocaleString()}\t\t$${subtotal.toLocaleString()}\n`;
                });
                content += `\nTOTAL\t\t\t\t$${totalCalculado.toLocaleString()}\n`;
            }
            if (values) {
                content += `\nINFORMACIÓN DE CONTACTO\n======================\n\n`;
                const name = values.fullName || values.nombres || "";
                const phone = values.phone || values.telefono || "";
                const email = values.email || "";
                const address = values.address || values.direccion || "";
                if (name) content += `Nombre: ${name}\n`;
                if (email) content += `Email: ${email}\n`;
                if (phone) content += `Teléfono: ${phone}\n`;
                if (address) content += `Dirección: ${address}\n`;
            }
            content += orderIds.length > 1
                ? `\nIDS DE PEDIDOS GENERADOS (${orderIds.length} tiendas): ${orderIds.join(", ")}\n==================\n`
                : `\nID DEL PEDIDO: ${pedidoId}\n==================\n`;

            const sendSocketMessage = async (textToEncrypt: string) => {
                let finalContent = textToEncrypt;
                let isEncrypted = false;
                let encryptionType = 0;
                if (config.chat.enableE2EE) {
                    if (!isE2EEReady) { log.warn("E2EE no está listo para enviar el mensaje del asesor"); }
                    try {
                        const encryptionTarget = (isAdminUser && targetUserId) ? targetUserId : "admin";
                        const encrypted = await SignalService.encryptMessage(encryptionTarget, finalContent);
                        finalContent = encrypted.ciphertext;
                        isEncrypted = encrypted.type !== 0;
                        encryptionType = encrypted.type;
                    } catch (err) { log.error("Error cifrando el mensaje", err); return; }
                }
                socket.emit("send_message", {
                    conversationId: conversation.id,
                    content: finalContent,
                    isEncrypted,
                    encryptionType,
                    senderId: session.user.id,
                    senderRole: session.user.role || "user",
                });
            };

            await sendSocketMessage(content);
            await new Promise(resolve => setTimeout(resolve, 500));
            await sendSocketMessage(orderIds.join(", "));
        };

        window.addEventListener("send_advisor_chat_message", handleAdvisorMessageEvent);
        return () => window.removeEventListener("send_advisor_chat_message", handleAdvisorMessageEvent);
    }, [socket, conversation?.id, session?.user, isE2EEReady, isAdminUser, targetUserId]);

    // ── Handlers ──────────────────────────────────────────────────────

    const handleCopy = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputMessage(e.target.value);
        if (!socket || !conversation?.id || !session?.user?.id) return;
        socket.emit("typing", { conversationId: conversation.id, senderId: session.user.id, isTyping: true });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit("typing", { conversationId: conversation.id, senderId: session.user.id, isTyping: false });
        }, 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || !socket || !conversation?.id || !session?.user?.id) {
            inputRef.current?.focus();
            return;
        }
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit("typing", { conversationId: conversation.id, senderId: session.user.id, isTyping: false });

        let finalContent = inputMessage.trim();
        let isEncrypted = false;
        let encryptionType = 0;

        if (config.chat.enableE2EE) {
            if (!isE2EEReady) { inputRef.current?.focus(); return; }
            try {
                const encryptionTarget = (isAdminUser && targetUserId) ? targetUserId : "admin";
                const encrypted = await SignalService.encryptMessage(encryptionTarget, finalContent);
                finalContent = encrypted.ciphertext;
                isEncrypted = encrypted.type !== 0;
                encryptionType = encrypted.type;
            } catch (err) {
                log.error("Error cifrando el mensaje, no se enviará en texto plano por seguridad:", err);
                inputRef.current?.focus();
                return;
            }
        }

        socket.emit("send_message", {
            conversationId: conversation.id,
            content: finalContent,
            isEncrypted,
            encryptionType,
            senderId: session.user.id,
            senderRole: session.user.role || "user",
            ...(replyingTo ? { replyToId: replyingTo.id } : {}),
        });

        setInputMessage("");
        setReplyingTo(null);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const handleDeleteConversation = async () => {
        if (!conversation?.id || !socket) return;
        setIsDeleting(true);
        try {
            const res = await deleteConversationAction(conversation.id);
            if (res && "error" in (res as any)) {
                log.error("Error deleting user conversation:", (res as any).error);
            } else {
                socket.emit("delete_conversation", { conversationId: conversation.id });
                setMessages([]);
                setConversation(null);
                setShowDeleteConfirm(false);
                setIsOpen(false);
                setUnreadCount(0);
            }
        } catch (err) {
            log.error("Error executing deleteConversationAction for user:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const isRouteAdmin = isClient && window.location.pathname.startsWith("/admin");

    return {
        // Auth & routing
        session,
        status,
        isAdminUser,
        isClient,
        isRouteAdmin,
        // UI state
        isOpen,
        setIsOpen,
        viewportHeight,
        showDeleteConfirm,
        setShowDeleteConfirm,
        activeMessageId,
        setActiveMessageId,
        copiedId,
        replyingTo,
        setReplyingTo,
        unreadCount,
        // Chat state
        conversation,
        messages,
        inputMessage,
        isLoading,
        isAdminTyping,
        isDeleting,
        isE2EEReady,
        isConnected,
        targetUserName,
        // Refs
        inputRef,
        chatContainerRef,
        messagesScrollRef,
        messagesEndRef,
        firstUnreadRef,
        // Handlers
        handleCopy,
        handleInputChange,
        handleSendMessage,
        handleDeleteConversation,
        // Translations
        t,
    };
}
