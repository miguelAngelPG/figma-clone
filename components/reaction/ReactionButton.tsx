
export function ReactionButton(
    {
        reaction,
        onSelect,
    }: {
        reaction: string;
        onSelect: (reaction: string) => void;
    }
) {
    return (
        <button
        className="transform select-none p-2 text-xl transition-transform hover:scale-150 focus:scale-150 focus:outline-none"
        onPointerDown={() => onSelect(reaction)}
        >
        {reaction}
        </button>
    );
}
