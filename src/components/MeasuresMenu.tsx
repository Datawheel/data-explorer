import React, {useState, useMemo} from "react";
import {useSelector} from "react-redux";
import {Menu, UnstyledButton, Group, Text} from "@mantine/core";
import {IconStack3, IconChevronRight} from "@tabler/icons-react";
import {useActions} from "../hooks/settings";
import {useTranslation} from "../hooks/translation";
import {selectLocale, selectMeasureMap} from "../state/queries";
import {selectOlapMeasureItems, selectOlapMeasureMap} from "../state/selectors";
import {filterMap} from "../utils/array";
import {getCaption} from "../utils/string";
import {buildMeasure} from "../utils/structs";
import {keyBy, safeRegExp} from "../utils/transform";
import {isActiveItem} from "../utils/validation";
import {LayoutParamsArea} from "./LayoutParamsArea";

type Props = {children};

function MeasuresMenu(props: Props) {
  const actions = useActions();

  const {code: locale} = useSelector(selectLocale);
  // param measures
  const itemMap = useSelector(selectMeasureMap);
  // selecter map server
  const measureMap = useSelector(selectOlapMeasureMap);
  //selected server
  const measures = useSelector(selectOlapMeasureItems);

  const [filter, setFilter] = useState("");
  const {translate: t} = useTranslation();
  const {children} = props;

  // no need to filter. remove for this implementation.
  const filteredItems = useMemo(() => {
    const query = filter ? safeRegExp(filter, "i") : null;
    return filterMap(measures, measure => {
      if (query && !query.test(getCaption(measure, locale))) {
        return null;
      }
      return itemMap[measure.name] || buildMeasure({active: false, ...measure});
    });
  }, [itemMap, measures, filter, locale]);

  const activeItems = filteredItems.filter(isActiveItem);

  const options = filteredItems.map(item => (
    <Menu.Item
      disabled={activeItems.map(active => active.name).includes(item.name)}
      key={item.name}
      onClick={() => {
        actions.updateMeasure({...item, active: !item.active});
        // actions.willRequestQuery();
      }}
    >
      {item.name}
    </Menu.Item>
  ));

  return (
    <Menu position="left">
      <Menu.Target>
        <UnstyledButton component="span">
          <Menu.Item
            icon={<IconStack3 />}
            sx={theme => ({
              [theme.fn.smallerThan("md")]: {
                maxWidth: 200
              }
            })}
          >
            <Group noWrap position="apart">
              <Text>{children}</Text>
              <IconChevronRight stroke={1.5} size={16} />
            </Group>
          </Menu.Item>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>{options}</Menu.Dropdown>
    </Menu>
  );
}

export default MeasuresMenu;
