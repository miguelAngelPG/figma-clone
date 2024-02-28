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
            {
                message && (
                    <div className="absolute left-2 top-5 px-4 py-2 text-sm rounded-3xl" style={{ background: color }}>
                        <p className="text-white whitespace-nowrap text-sm leading-relaxed">{message}</p>
                    </div>
                )
            }
        </div>
    );
};

