import { useGame } from '../../state/GameContext';
import { PixelButton } from '../ui/PixelButton';
import '../../styles/screens.css';

/** 内容提示（PRD §2/§5：开场提示、可随时退出、不收集真实信息） */
export function ContentWarning() {
  const { setScreen, startRun } = useGame();

  return (
    <div className="warning-screen">
      <div className="warning-panel pixel-panel">
        <h2 className="warning-panel__title">内容提示</h2>
        <ul className="warning-panel__list">
          <li>本作包含校园霸凌、造谣传谣与网络暴力情节的虚构描写，可能引起情绪不适。</li>
          <li>故事中的人物、学校、群聊与平台均为虚构，与现实无关。</li>
          <li>你可以随时通过菜单暂停、退出；进度会自动保存在本机。</li>
          <li>本作不收集任何真实姓名、真实经历或私人聊天记录。</li>
          <li>如果你或身边的人正在经历类似的事，请告诉信任的大人或老师，寻求帮助不是软弱。</li>
        </ul>
        <div className="warning-panel__actions">
          <PixelButton onClick={() => setScreen('title')}>返回</PixelButton>
          <PixelButton
            variant="accent"
            onClick={() => {
              startRun('ch1');
            }}
          >
            我已知晓，进入故事
          </PixelButton>
        </div>
      </div>
    </div>
  );
}
