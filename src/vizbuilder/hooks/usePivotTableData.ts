import {useSelector} from "react-redux";
import {selectCurrentQueryItem} from "../../state/queries";
import {useFetchQuery} from "../../hooks/useQueryApi";

export function usePivotTableData() {
  const queryItem = useSelector(selectCurrentQueryItem);
  const queryLink = queryItem.link;
  const query = useFetchQuery(queryItem.params, queryLink, {
    withoutPagination: true
  });
  return query;
}
