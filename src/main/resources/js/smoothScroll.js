const scrollDuration = 200;
const scrollDistince = 50;
let startOffset;
let targetOffset = null;
let startTime;

function smoothScroll(event) {
    // 是否正在滚动
    const isScrolling = (targetOffset != null);

    // 起始位置，取当前位置
    startOffset = window.pageYOffset;
    // 开始时间，取当前时间
    startTime = performance.now();
    // 本次滚动的相对距离
    const scrollStep = event.deltaY > 0 ? scrollDistince : -scrollDistince;

    if (isScrolling) {
        // 正在滚动，基于上次目标位置计算目标位置
        targetOffset = targetOffset + scrollStep;
    } else {
        // 不在滚动，基于当前位置计算目标位置
        targetOffset = startOffset + scrollStep;
    }

    if (!isScrolling) {
        // 不在滚动，开始滚动
        step();
    }

}

function step() {
    // 是否正在滚动
    const isScrolling = (targetOffset != null);

    if (!isScrolling) {
        // 不在滚动，无需执行
        return;
    }

    // 当前位置
    const currentOffset = window.pageYOffset;
    if (currentOffset == targetOffset) {
        // 当前位置和目标位置相同，结束执行
        targetOffset = null;
        return;
    }

    // 已经过的时间
    const elapsedTime = performance.now() - startTime;
    // 执行进度[0, 1]
    const progress = Math.min(elapsedTime / scrollDuration, 1);
    // 当前步骤的目标位置
    const currentTargetOffset = startOffset + (targetOffset - startOffset) * progress;

    if (Math.abs(currentOffset - currentTargetOffset) < 1) {
        // 当前步骤的目标位置只需要滚动不到1px，则当前步骤不做滚动，继续下一步骤
        requestAnimationFrame(step);
        return;
    }

    // 更新滚动位置
    window.scrollTo(0, currentTargetOffset);

    if (currentOffset == window.pageYOffset) {
        // 滚动后位置没有变化，结束执行
        targetOffset = null;
        return;
    }

    if (elapsedTime > scrollDuration) {
        // 时间已结束，结束执行
        targetOffset = null;
        return;
    }

    // 当前步骤成功执行，继续下一步骤
    requestAnimationFrame(step);
}

// 添加滚轮事件监听器
document.addEventListener("wheel", function (event) {
    // 阻止默认滚动行为
    event.preventDefault();
    // 调用平滑滚动函数
    smoothScroll(event);
}, {
    passive: false
});
