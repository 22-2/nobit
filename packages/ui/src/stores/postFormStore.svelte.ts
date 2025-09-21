import type { PostData } from "../types";
import { type PostFormState, type PostFormStoreDependencies } from "./types";

/**
 * 投稿フォームのUI状態とロジックを管理するSvelte 5ストアを作成します。
 * @param deps - 外部の依存関係 (投稿サービス、通知機能、連携する関数など)
 */
export function createPostFormStore(deps: PostFormStoreDependencies) {
    const { threadService, notifier, logger, getThreadUrl, onPostSuccess } =
        deps;

    const postFormState = $state<PostFormState>({
        postData: null,
        isInlineFormVisible: false,
        isSubmitting: false,
        isConfirmationVisible: false,
        confirmationHtml: "",
        confirmationData: null,
    });

    const resetPostConfirmationState = () => {
        postFormState.isConfirmationVisible = false;
        postFormState.confirmationData = null;
        postFormState.confirmationHtml = "";
        postFormState.isSubmitting = false;
        postFormState.postData = null;
    };

    const postInternal = async (
        postData: PostData,
        confirmationData?: Record<string, string>
    ): Promise<void> => {
        const threadUrl = getThreadUrl();
        if (!threadUrl) {
            notifier("スレッドのURLが取得できませんでした。");
            return;
        }

        if (!confirmationData) {
            postFormState.isSubmitting = true;
        }

        const result = await threadService.post(
            threadUrl,
            postData,
            { "User-Agent": "Monazilla/1.00 Siki/0.0.1" },
            confirmationData
        );

        switch (result.kind) {
            case "success":
                notifier("書き込みに成功しました。");
                postFormState.isInlineFormVisible = false;
                resetPostConfirmationState();
                await onPostSuccess(); // 依存先の再読み込み処理を呼び出す
                break;
            case "error":
                notifier(`書き込みエラー: ${result.message}`);
                logger.error(`書き込みエラー: `, result);
                postFormState.isConfirmationVisible = false;
                postFormState.isSubmitting = false;
                break;
            case "confirmation":
                postFormState.isConfirmationVisible = true;
                postFormState.confirmationHtml = result.html;
                postFormState.confirmationData = result.formData;
                postFormState.isSubmitting = false; // 確認画面表示中は送信中ではない
                break;
        }
    };

    return {
        postForm: postFormState,
        showInlineForm: () => {
            postFormState.isInlineFormVisible = true;
        },
        hideInlineForm: () => {
            postFormState.isInlineFormVisible = false;
        },
        submitPost: async (data: PostData) => {
            postFormState.postData = data;
            await postInternal(data);
        },
        submitPostWithConfirmation: async () => {
            const { postData, confirmationData } = postFormState;
            if (postData && confirmationData) {
                await postInternal(postData, confirmationData);
            }
        },
        cancelPostConfirmation: resetPostConfirmationState,
    };
}
