import { useMyPresence, useOthers } from "@/liveblocks.config"
import { LiveCursors } from "./cursor/LiveCursors"
import { useCallback } from "react"

function Live() {

    const others = useOthers()
    const [ myPresence, updateMyPresence ] = useMyPresence()
    const { cursor } = myPresence as any

    const handlePointerMove = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        
        const x = e.clientX - e.currentTarget.getBoundingClientRect().x
        const y = e.clientY - e.currentTarget.getBoundingClientRect().y

        console.log({x, y})
        updateMyPresence({ cursor: { x, y }})
    }, [])

    const handlePointerLeave = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        
        updateMyPresence({ cursor: null, message: null})
    }, [])

    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        e.preventDefault()
        
        const x = e.clientX - e.currentTarget.getBoundingClientRect().x
        const y = e.clientY - e.currentTarget.getBoundingClientRect().y
        updateMyPresence({ cursor: { x, y }})
    }, [])
    
    return (
        <div
            onPointerMove={ handlePointerMove }
            onPointerLeave={ handlePointerLeave }
            onPointerDown={ handlePointerDown }
            className="border-2 border-green-500 h-full w-full flex justify-center items-center text-center"
        >
            <LiveCursors others={others}/>
        </div>
    )
}

export default Live