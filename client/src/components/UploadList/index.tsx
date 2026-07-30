import React from "react";
import { FileUpload, Flex, FormatByte, IconButton, Spacer, Tag, Text, useFileUploadContext } from "@chakra-ui/react";

// Custom components
import Icon from "@components/Icon";

// Utility functions
import { getFileExtension } from "@lib/util";

/**
 * Custom `FileUploadList` component to better render the collection of uploaded files
 */
const FileUploadList = () => {
  const fileUpload = useFileUploadContext();
  const files = fileUpload.acceptedFiles;

  if (files.length === 0) {
    return null;
  }

  return (
    <FileUpload.ItemGroup>
      {files.map((file: File) => (
        <FileUpload.Item w={"100%"} p={"2"} rounded={"md"} file={file} key={file.name}>
          <Flex direction={"column"} gap={"1"} align={"start"}>
            {/* File information */}
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Icon size={"xs"} name={"file"} />
              <Text fontSize={"xs"} fontWeight={"semibold"}>
                {file.name}
              </Text>
            </Flex>
            <Flex direction={"row"} align={"center"} gap={"1"}>
              <Tag.Root key={getFileExtension(file.type)} size={"sm"} colorPalette={"gray"} variant={"outline"}>
                <Tag.Label fontSize={"xs"}>{getFileExtension(file.type)}</Tag.Label>
              </Tag.Root>
              <Text fontSize={"xs"} color={"text.muted"}>
                <FormatByte value={file.size} />
              </Text>
            </Flex>
          </Flex>

          <Spacer />

          {/* `IconButton` to remove uploaded file */}
          <IconButton size={"xs"} rounded={"md"} colorPalette={"red"}>
            <FileUpload.ItemDeleteTrigger asChild>
              <Icon name={"delete"} size={"xs"} />
            </FileUpload.ItemDeleteTrigger>
          </IconButton>
        </FileUpload.Item>
      ))}
    </FileUpload.ItemGroup>
  );
};

export default FileUploadList;
