import CursorSVG from "@/public/assets/CursorSVG";

type CursorProps = {
    x: number;
    y: number;
    color: string;
    message: string;
};

export const Cursor = ({ color, x, y, message }: CursorProps) => {

    return (
        <div 
            className="pointer-events-none absolute top-0 left-0"
            style={{ transform: `translate(${x}px, ${y}px)`}}
        >
            <CursorSVG color={color} />
            {/* //TODO: MESSAGE */}
        </div>
    );
};

