"use client";
import React from "react";
// Import the official compatibility patch for antd v5 on React 19
// This package modifies the rendering behavior so antd's static methods
// (Modal, Notification, Message, etc.) and effects (wave) work correctly.
import "@ant-design/v5-patch-for-react-19";

export default function AntdCompat(): null {
  // This component only exists to import the compatibility layer on the client.
  // It renders nothing.
  return null;
}
