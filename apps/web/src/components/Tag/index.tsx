import { CSSObject } from '@emotion/react';

interface Props {
  bgColor: string;
  bdColor: string;
  ftColor: string;
  style?: object;
}

const Tag: React.FC<Props> = props => {
  const { children, bgColor, bdColor, ftColor, style = {} } = props;

  return (
    <span
      style={{
        display: 'inline-block',
        color: ftColor,
        fontSize: '1rem',
        border: `1px solid ${bdColor}`,
        backgroundColor: bgColor,
        padding: '1vw 2vw 1vw 2vw',
        margin: '0 0vw 1vh 0',
        ...style
      }}
    >
      {children}
    </span>
  );
};

export default Tag;
