import classNames from "classnames";
import { createSignal, JSX, Show } from "solid-js";

type ModalProps<ModalData> = {
    children(data: ModalData): JSX.Element;
}

type ModalState<ModalData> = ModalData & {
    open: boolean;
    closing: boolean;
}

type ModalCreator<ModalData> = [
    (data: ModalData) => void,
    () => void,
    {
        Modal(props: ModalProps<ModalData>): JSX.Element,
    }
];

export function createModal<ModalData>(initialData: ModalData): ModalCreator<ModalData> {
    const [modalState, setModalState] = createSignal<ModalState<ModalData>>({
        ...initialData,
        open: false,
        closing: false,
    });

    function openModal(data: ModalData) {
        setModalState(() => ({
            ...data,
            open: true,
            closing: false,
        }));
    }

    function closeModal() {
        setModalState(() => ({
            ...modalState(),
            closing: true,
        }));

        setTimeout(() => {
            setModalState(() => ({
                ...modalState(),
                open: false,
                closing: false,
            }));
        }, 200);
    }

    function handleOverlayClick(event: MouseEvent) {
        const overlay = event.currentTarget as Element;
        const modal = overlay.firstChild as Element;
        const { x, y, width, height } = modal.getBoundingClientRect();
        
        if (event.x < x || event.x > x + width || event.y < y || event.y > y + height) {
            closeModal();
        }
    }

    const modalStyles = () => classNames("absolute top-0 left-0 w-full h-full backdrop-blur bg-[#AAAAAA44]", {
        "animate-fadein": modalState().open && !modalState().closing,
        "animate-fadeout": modalState().closing,
        "opacity-0": !modalState().open && !modalState().closing,
    });
    
    return [
        openModal,
        closeModal,
        {
            Modal: (props) => (
                <Show when={modalState().open}>
                    <div class={modalStyles()} onClick={handleOverlayClick}>
                        <div class="absolute top-1/2 left-1/2 translate-x-[-50%] translate-y-[-50%] bg-white w-[80%] p-2 rounded-md">
                            {props.children(modalState())}
                        </div>
                    </div>
                </Show>
            )
        }
    ];
}