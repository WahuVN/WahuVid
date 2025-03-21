import { Heart } from "lucide-react";

const LikeAnimation = () =>
    <Heart
        size={100}
        color="red"
        fill="red"
        style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0,
            animation: 'likeAnimation 1s ease-out',
        }}
    />

export default LikeAnimation;
