import React, {PropsWithChildren} from "react";
import {Tooltip, Popover, Text, ActionIcon, ActionIconProps, Button, Col} from "@mantine/core";

type CustomActionIconProps = ActionIconProps & {
  disabled: boolean;
  showTooltip: boolean;
  label: string;
  onClick: () => void;
};

const CustomActionIcon: React.FC<PropsWithChildren<CustomActionIconProps>> = ({
  disabled,
  showTooltip,
  onClick,
  children,
  label
}) => {
  const [popoverOpened, setPopoverOpened] = React.useState(false);
  const actionIcon = (
    <ActionIcon disabled={disabled} size={25} ml={5} onClick={onClick}>
      {children}
    </ActionIcon>
  );

  return showTooltip ? (
    <div onMouseEnter={() => setPopoverOpened(true)} onMouseLeave={() => setPopoverOpened(false)}>
      <Popover
        width={200}
        position="left"
        withArrow
        opened={popoverOpened}
        styles={theme => ({
          dropdown: {
            backgroundColor: theme.colors.dark[6],
            border: `1px solid ${theme.colors.gray[2]}`,
            borderRadius: theme.radius.sm,
            padding: theme.spacing.xs,
            color: theme.white
          },
          arrow: {
            backgroundColor: theme.colors.dark[6]
          }
        })}
      >
        <Popover.Target>{actionIcon}</Popover.Target>
        <Popover.Dropdown>
          <Text size="xs">{label}</Text>
        </Popover.Dropdown>
      </Popover>
    </div>
  ) : (
    actionIcon
  );
};

export default CustomActionIcon;
