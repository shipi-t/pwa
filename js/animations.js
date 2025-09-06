/**********************************************************
Animations
**********************************************************/
export function fadeOut(element) {
    const animation = element.animate(
        [
            { opacity: 1 }, // Start
            { opacity: 0 }, // End
        ],
        {
            duration: 200, // Animation duration in milliseconds
            easing: "ease-in-out",
            fill: "forwards", // Keep the final state (opacity: 0)
        }
    );

    // After the animation finishes, add the 'hidden' class
    animation.finished.then(() => {
        element.classList.add("hidden");
    });
    return animation.finished;
}

export function fadeIn(element) {
    // First, remove the 'hidden' class to make the element part of the layout
    element.classList.remove("hidden");
    const animation = element.animate(
        [
            { opacity: 0 }, // Start
            { opacity: 1 }, // End
        ],
        {
            duration: 200, // Animation duration in milliseconds
            easing: "ease",
            fill: "forwards", // Keep the final state (opacity: 1)
        }
    );
    return animation.finished;
}
