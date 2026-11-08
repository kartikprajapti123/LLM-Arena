import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../slice/Auth.Slice.jsx"
import { workspaceReducer,workspaceMemberReducer,workspaceInviteReducer, workspaceCredentialReducer } from "../slice/Workspace.Slice.jsx";import projectReducer from "../slice/Project.Slice.jsx"
import LLMProviderReducer from "../slice/LLMProvider.Slice.jsx"
import LLMProviderListCreateUpdateDelete from "../page/global_llm_management/LLMProviderListCreateUpdateDelete.jsx";
import LLMModelReducer from "../slice/LLMModel.Slice.jsx"
import LLMProjectModelReducer from "../slice/LLMProjectModel.Slice.jsx"
import ResponseReducer from "../slice/Response.Slice.jsx"
import ComparisonReducer from "../slice/Comparison.Slice.jsx"
import conversationReducer from "../slice/Conversations.Slice.jsx"
import notificationReducer from "../slice/Notification.Slice.jsx"
export const CommonStore=configureStore({
    reducer:{
        auth:authReducer,
        workspace:workspaceReducer,
        workspaceMember:workspaceMemberReducer,
        workspaceCredential:workspaceCredentialReducer,

        workspaceInvite:workspaceInviteReducer,
        project:projectReducer,
        LLMProvider:LLMProviderReducer,
        LLMModel:LLMModelReducer,
        LLMProjectModel:LLMProjectModelReducer,
        response:ResponseReducer,
        comparison:ComparisonReducer,
        conversation:conversationReducer,
        notification:notificationReducer

    }
})