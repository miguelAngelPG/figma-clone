"use client";

import { useCallback, useEffect, useState } from "react";

import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from "@/liveblocks.config";
import useInterval from "@/hooks/useInterval";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import { shortcuts } from "@/constants";

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "./ui/context-menu";
import FlyingReaction from "./reaction/FlyingReactions";
import { CursorChat } from "./cursor/CursorChat";
import ReactionSelector from "./reaction/ReactionSelector";
import { LiveCursors } from "./cursor/LiveCursors";

type Props = {
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
  undo: () => void;
  redo: () => void;
};

const Live = ({ canvasRef, undo, redo }: Props) => {

    const others = useOthers();

    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const broadcast = useBroadcastEvent();

    const [reactions, setReactions] = useState<Reaction[]>([]);

    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    });

    const setReaction = useCallback((reaction: string) => {
        setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false });
    }, []);

    useInterval(() => {
        setReactions((reactions) => reactions.filter((reaction) => reaction.timestamp > Date.now() - 4000));
    }, 1000);

    useInterval(() => {
        if (cursorState.mode === CursorMode.Reaction && cursorState.isPressed && cursor) {
            // concat all the reactions created on mouse click
            setReactions((reactions) =>
            reactions.concat([
                {
                point: { x: cursor.x, y: cursor.y },
                value: cursorState.reaction,
                timestamp: Date.now(),
                },
            ])
            );

            // Broadcast the reaction to other users
            broadcast({
            x: cursor.x,
            y: cursor.y,
            value: cursorState.reaction,
            });
        }
    }, 100);

    useEventListener((eventData) => {
        const event = eventData.event as ReactionEvent;
        setReactions((reactions) =>
            reactions.concat([
            {
                point: { x: event.x, y: event.y },
                value: event.value,
                timestamp: Date.now(),
            },
            ])
        );
    });

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === "/") {
            setCursorState({
                mode: CursorMode.Chat,
                previousMessage: null,
                message: "",
            });
            } else if (e.key === "Escape") {
            updateMyPresence({ message: "" });
            setCursorState({ mode: CursorMode.Hidden });
            } else if (e.key === "e") {
            setCursorState({ mode: CursorMode.ReactionSelector });
            }
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/") {
            e.preventDefault();
            }
        };

        window.addEventListener("keyup", onKeyUp);
        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keyup", onKeyUp);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [updateMyPresence]);

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if (cursor == null || cursorState.mode !== CursorMode.ReactionSelector) {
            // get the cursor position in the canvas
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

            // broadcast the cursor position to other users
            updateMyPresence({
            cursor: {
                x,
                y,
            },
            });
        }
    }, [updateMyPresence]);

    const handlePointerLeave = useCallback(() => {
        setCursorState({
            mode: CursorMode.Hidden,
        });
        updateMyPresence({
            cursor: null,
            message: null,
        });
    }, []);

    const handlePointerDown = useCallback(
        (event: React.PointerEvent) => {
            // get the cursor position in the canvas
            const x = event.clientX - event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY - event.currentTarget.getBoundingClientRect().y;

            updateMyPresence({
            cursor: {
                x,
                y,
            },
            });

            // if cursor is in reaction mode, set isPressed to true
            setCursorState((state: CursorState) =>
            cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: true } : state
            );
        },
        [cursorState.mode, setCursorState]
        );

    const handlePointerUp = useCallback(() => {
        setCursorState((state: CursorState) =>
        cursorState.mode === CursorMode.Reaction ? { ...state, isPressed: false } : state
        );
    }, [cursorState.mode, setCursorState]);

    const handleContextMenuClick = useCallback((key: string) => {
        switch (key) {
            case "Chat":
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: "",
                });
            break;

            case "Reactions":
                setCursorState({ mode: CursorMode.ReactionSelector });
            break;

            case "Undo":
                undo();
            break;

            case "Redo":
                redo();
            break;

            default:
            break;
        }
    }, []);

  return (
    <ContextMenu>
        <ContextMenuTrigger
            className="relative flex h-full w-full flex-1 items-center justify-center"
            id="canvas"
            style={{
            cursor: cursorState.mode === CursorMode.Chat ? "none" : "auto",
            }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >
            <canvas ref={canvasRef} />

            {/* Render the reactions */}
            {reactions.map((reaction) => (
            <FlyingReaction
                key={reaction.timestamp.toString()}
                x={reaction.point.x}
                y={reaction.point.y}
                timestamp={reaction.timestamp}
                value={reaction.value}
            />
            ))}

            {/* If cursor is in chat mode, show the chat cursor */}
            {cursor && (
            <CursorChat
                cursor={cursor}
                cursorState={cursorState}
                setCursorState={setCursorState}
                updateMyPresence={updateMyPresence}
            />
            )}

            {/* If cursor is in reaction selector mode, show the reaction selector */}
            {cursorState.mode === CursorMode.ReactionSelector && (
            <ReactionSelector
                setReaction={(reaction) => {
                setReaction(reaction);
                }}
            />
            )}

            {/* Show the live cursors of other users */}
            <LiveCursors others={others} />

        </ContextMenuTrigger>

        <ContextMenuContent className="right-menu-content">
            {shortcuts.map((item) => (
            <ContextMenuItem
                key={item.key}
                className="right-menu-item"
                onClick={() => handleContextMenuClick(item.name)}
            >
                <p>{item.name}</p>
                <p className="text-xs text-primary-grey-300">{item.shortcut}</p>
            </ContextMenuItem>
            ))}
        </ContextMenuContent>
    </ContextMenu>
  );
};

export default Live;