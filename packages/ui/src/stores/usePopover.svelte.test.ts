import {
    describe,
    it,
    beforeEach,
    afterEach,
    expect,
    vi,
    beforeAll,
    afterAll,
} from "vitest";
import { usePopover } from "./usePopover.svelte";
import { CustomHoverPopover } from "../view/common/CustomHoverPopover";

// Mock CustomHoverPopover
vi.mock("../view/common/CustomHoverPopover", () => {
    const Component = class {
        children: any[] = [];
        onload() {}
        onunload() {}
        addChild(child: any) {
            this.children.push(child);
            child.onload();
        }
        removeChild(child: any) {
            const index = this.children.indexOf(child);
            if (index > -1) {
                this.children.splice(index, 1);
                child.onunload();
            }
        }
    };

    const CustomHoverPopoverMock = vi
        .fn()
        .mockImplementation((service, parent, target, level, event) => {
            const popover = new Component();
            return Object.assign(popover, {
                hoverEl: document.createElement("div"),
                targetEl: target,
                level: level,
                isShown: false,
                show: vi.fn(function (this: any) {
                    this.isShown = true;
                }),
                hide: vi.fn(function (this: any) {
                    this.isShown = false;
                }),
                // Mocking the internal component management
                ...popover,
            });
        });
    return {
        CustomHoverPopover: CustomHoverPopoverMock,
        Component,
    };
});

describe("usePopover", () => {
    let container: HTMLElement;
    let popoverService: ReturnType<typeof usePopover>;

    beforeAll(() => {
        // JSDOM environment
        container = document.createElement("div");
        document.body.appendChild(container);
    });

    afterAll(() => {
        document.body.removeChild(container);
    });

    beforeEach(() => {
        // Use fake timers to control setTimeout
        vi.useFakeTimers();

        // Create a new popover instance
        popoverService = usePopover();

        // Initialize the service
        popoverService.init(container);

        const mockPosts = [
            {
                authorId: "user1",
                authorName: "Test User 1",
                mail: "",
                content: "Hello, world!",
                date: new Date(),
                references: [],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [1],
            },
            {
                authorId: "user2",
                authorName: "Test User 2",
                mail: "",
                content: "Hello, again!",
                date: new Date(),
                references: [],
                replies: [],
                hasImage: false,
                hasExternalLink: false,
                postIdCount: 1,
                siblingPostNumbers: [2],
            },
        ];
        popoverService.setThreadData({
            // id: "1234567890",
            title: "test",
            url: "http://example.com/1234567890",
            posts: mockPosts as any,
            // resCount: mockPosts.length,
        });
    });

    afterEach(() => {
        // Restore real timers
        vi.useRealTimers();
        popoverService.destroy();
        // Clear any mocks
        vi.clearAllMocks();
    });

    it("should not hide popover when moving from parent to child", () => {
        const parentTarget = document.createElement("div");
        const childTarget = document.createElement("div");
        const mockEvent = new MouseEvent("mouseover");

        // 1. Show parent and child popovers
        popoverService.handleHover(parentTarget, 0, 0, mockEvent);
        popoverService.handleHover(childTarget, 1, 1, mockEvent);
        expect(popoverService.activePopovers).toHaveLength(2);

        // 2. Simulate mouse leaving parent, which starts the timer
        const serviceInterface = (CustomHoverPopover as any).mock.calls[0][0];
        serviceInterface.startHideTimer();

        // 3. Advance time (but not enough to hide)
        vi.advanceTimersByTime(100);

        // 4. Simulate mouse entering child, which clears the timer
        serviceInterface.clearHideTimer();

        // 5. Advance time past the original hide timeout
        vi.advanceTimersByTime(500);

        // 6. Assert popovers are still visible
        expect(popoverService.activePopovers).toHaveLength(2);
        const parentInstance = (CustomHoverPopover as any).mock.results[0]
            .value;
        expect(parentInstance.hide).not.toHaveBeenCalled();
    });

    it("should hide all popovers when mouse leaves all of them", () => {
        const targetEl = document.createElement("div");
        const mockEvent = new MouseEvent("mouseover");

        // 1. Show a popover
        popoverService.handleHover(targetEl, 0, 0, mockEvent);
        expect(popoverService.activePopovers).toHaveLength(1);
        const popover = popoverService.activePopovers[0] as InstanceType<
            typeof CustomHoverPopover
        >;

        // 2. Simulate mouse leaving the popover
        const serviceInterface = (CustomHoverPopover as any).mock.calls[0][0];
        serviceInterface.startHideTimer();

        // 3. Advance time enough to trigger the hide timeout
        vi.advanceTimersByTime(500);

        // 4. Assert that all popovers are hidden
        expect(popoverService.activePopovers).toHaveLength(0);
        const popoverInstance = (CustomHoverPopover as any).mock.results[0]
            .value;
        expect(popoverInstance.hide).toHaveBeenCalled();
    });
});
