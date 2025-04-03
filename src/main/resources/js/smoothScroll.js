const scrollDuration = 200;
const scrollDistince = 100;
let startOffset;
let targetOffset;
let startTime;

function smoothScroll(event) {
    startOffset = window.pageYOffset; // 当前滚动位置
    startTime = performance.now(); // 开始时间
    const scrollStep = event.deltaY > 0 ? scrollDistince : -scrollDistince; // 本次滚动的相对距离
    if (targetOffset) {
        targetOffset = targetOffset + scrollStep;
    } else {
        targetOffset = startOffset + scrollStep;
    }
    // console.log("startOffset, targetOffset", startOffset, targetOffset)
}

function animation() {
    if (!targetOffset) {
        return;
    }

    const currentOffset = window.pageYOffset; // 当前滚动位置
    if (currentOffset == targetOffset) {
        // console.log("finish: currentOffset == targetOffset")
        targetOffset = null;
        return;
    }

    const elapsedTime = performance.now() - startTime; // 已经过的时间

    if (elapsedTime < 4) {
        // 本次执行间隔太短，跳过
        return;
    }

    const progress = Math.min(elapsedTime / scrollDuration, 1); // 计算进度 (0 到 1)

    const currentTargetOffset = startOffset + (targetOffset - startOffset) * progress;
    window.scrollTo(0, currentTargetOffset); // 更新滚动位置
    // console.log("scroll from " + currentOffset + " to " + currentTargetOffset);

    if (currentOffset == window.pageYOffset) {
        // 位置没有变化
        // console.log("finish currentOffset == window.pageYOffset");
        targetOffset = null;
    }
    if (elapsedTime > scrollDuration) {
        // 时间已结束
        // console.log("finish elapsedTime > scrollDuration");
        targetOffset = null;
    }
}

// 添加滚轮事件监听器
document.addEventListener("wheel", function (event) {
    event.preventDefault(); // 阻止默认滚动行为
    smoothScroll(event); // 调用平滑滚动函数
}, {
    passive: false
});

setInterval(animation, 5);