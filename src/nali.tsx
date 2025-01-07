import { useExec } from "@raycast/utils";
import { Action, ActionPanel, LaunchProps, List, showToast, Toast } from "@raycast/api";
import { useMemo } from "react";
import { cpus } from "node:os";
import fs from "fs";

interface NaliResponse {
  type: number,
  ip: string,
  text: string,
  source: string,
  info: {
    country: string,
    area: string,
    name: string,
    link: string,
  }
}

export default function Command(props: LaunchProps<{ arguments: Arguments.Nali }>) {
  const { query } = props.arguments;
  let { dns } = props.arguments;
  const brewPath = cpus()[0].model.includes("Apple") ? "/opt/homebrew/bin/" : "/usr/local/bin/";

  const naliPath = `${brewPath}nali`;
  const doggoPath = `${brewPath}doggo`;

  if (!fs.existsSync(naliPath)) {
    showToast({
      style: Toast.Style.Failure,
      title: "Nali not found",
      message: "Please install nali via Homebrew.",
    });
    return null;
  }

  if (!fs.existsSync(doggoPath)) {
    showToast({
      style: Toast.Style.Failure,
      title: "Doggo not found",
      message: "Please install doggo via Homebrew.",
    });
    return null;
  }

  const isIpV4Address = /^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$/.test(query);
  const isIpV6Address = /^[0-9a-fA-F:]+$/.test(query);
  const isIpAddress = isIpV4Address || isIpV6Address;

  dns = dns || "https://223.5.5.5/dns-query";

  const commands = isIpAddress
    ? `${naliPath} ${query} -j`
    : `${doggoPath} ${query} -t=A,AAAA --short @${dns} | ${naliPath} -j`;

  const { isLoading, error, data } = useExec(commands, { shell: true });

  if (error) {
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to fetch data",
      message: "Please check the format of the query and try again.",
    });
  }

  const results = useMemo<NaliResponse[]>(() => {
    if (!data) return [];
    try {
      return data.split("\n").map((line) => JSON.parse(line));
    } catch (error) {
      return [];
    }
  }, [data]);

  return (
    <List isLoading={isLoading}>
      <List.Section
        title="IPV4"
        subtitle="IPV4 地址查询结果"
      >
        {results.filter((item) => item.type == 0).map((result, index) => (
          <List.Item
            key={index}
            title={result.ip}
            subtitle={result.text}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy result" content={result.ip} />
              </ActionPanel>
            }
          />))}
      </List.Section>
      <List.Section
        title="IPV6"
        subtitle="IPV6 地址查询结果"
      >
        {results.filter((item) => item.type == 1).map((result, index) => (
          <List.Item
            key={index}
            title={result.ip}
            subtitle={result.text}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy result" content={result.ip} />
              </ActionPanel>
            }
          />))}
      </List.Section>

      <List.Section
        title="CNAME"
        subtitle="CNAME 查询结果"
      >
        {results.filter((item) => item.type == 2).map((result, index) => (
          <List.Item
            key={index}
            title={result.ip}
            subtitle={result.text}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard title="Copy result" content={result.ip} />
              </ActionPanel>
            }
          />))}
      </List.Section>
    </List>
  );
}