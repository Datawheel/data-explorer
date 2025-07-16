import {useQuery} from "@tanstack/react-query";
import {type TesseractDataResponse, useLogicLayer} from "../../api";
import {queryParamsToRequest} from "../../api/tesseract/parse";
import type {QueryParams} from "../../utils/structs";

export function useQueryData(params: QueryParams) {
  const {tesseract} = useLogicLayer();

  return useQuery({
    queryKey: ["tesseract", "data", params],
    queryFn() {
      return tesseract
        .fetchData({
          request: queryParamsToRequest(params),
          format: "jsonrecords",
        })
        .then(response => response.json() as Promise<TesseractDataResponse>);
    },
    staleTime: 60 * 60 * 1000, // 1h
    retry: false,
  });
}
