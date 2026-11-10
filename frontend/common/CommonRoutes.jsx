import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Login } from "../page/auth/Login.jsx";
import { Register } from "../page/auth/Register.jsx";
import { ForgotPassword } from "../page/auth/ForgotPassword.jsx";
import { ChangePassword } from "../page/auth/ChangePassword.jsx";
import {OtpVerify} from "../page/auth/OtpVerify.jsx";
import { WorkspaceOnBoarding } from "../page/WorkspaceOnBoarding.jsx";
// import { Layout } from "antd";
import { UpdateProfile } from "../page/settings/UpdateProfile.jsx";
import CommonLayout from "./CommonLayout.jsx";
import ResetPassword from "../page/settings/ResetPassword.jsx";
import { UpdateWorkspace } from "../page/settings/UpdateWorkspace.jsx";
import { WorkspaceMember } from "../page/workspace/WorkspaceMember.jsx";
import { WorkspaceInvite } from "../page/workspace/WorkspaceInvite.jsx";
import { Project } from "../page/project/Project.jsx";
import LLMProviderListCreateUpdateDelete from "../page/global_llm_management/LLMProviderListCreateUpdateDelete.jsx";
import LLMModelListCreateUpdateDelete from "../page/global_llm_management/LLMModelListCreateUpdateDelete.jsx";
import { LLMProjectModelListCreateUpdateDelete } from "../page/project/LLMProjectModelListCreateUpdateDelete.jsx";
import { WorkspaceCredential } from "../page/workspace/WorkspaceCredential.jsx";
import RunComparison from "../page/project/RunComparison.jsx";
import Chat from "../page/conversation/Chat.jsx";
import NotFound from "../page/NotFound.jsx";
import Dashboard from "../page/Dashboard.jsx";
import TermsAndCondition from "../page/TermsAndCondition.jsx";
import PrivacyPage from "../page/PrivacyPage.jsx";
import Notification from "../page/Notification.jsx";
export const CommonRoutes = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route element={<Login />} path="/login/" />
          <Route element={<Register />} path="/register/" />
          <Route element={<ForgotPassword />} path="/forgot-password/" />
          <Route element={<ChangePassword />} path="/change-password/:token/" />
          <Route element={<OtpVerify />} path="/otp-verify/:token/" />
          <Route element={<WorkspaceOnBoarding/>} path="workspace-on-boarding"/> 


        <Route element={<CommonLayout/>}>

          <Route element={<Dashboard/>} path="/"/> 
          <Route element={<UpdateProfile/>} path="/update-profile/"/> 
          <Route element={<ResetPassword/>} path="/reset-password/"/> 
          <Route element={<UpdateWorkspace/>} path="/update-workspace/"></Route>

          <Route element={<WorkspaceMember/>} path="/workspace-member/"></Route>
          <Route element={<WorkspaceInvite/>} path="/workspace-invite/"></Route>
          <Route element={<WorkspaceCredential/>} path="/workspace-credential/"></Route>

          <Route element={<Project/>} path="/project/"></Route>
          <Route element={<RunComparison/>} path="/run-comparison/:project_id/"></Route>
          <Route element={<Chat/>} path="/chat/"></Route>
          <Route element={<Notification/>} path="/notifications/"></Route>



          <Route element={<LLMProviderListCreateUpdateDelete/>} path="/llm-provider/"></Route>
          <Route element={<LLMModelListCreateUpdateDelete/>} path="/llm-model/"></Route>
          <Route element={<LLMProjectModelListCreateUpdateDelete/>} path="/llm-project-model/"></Route>




        </Route>
        <Route element={<TermsAndCondition/>} path="/terms-and-condition/"></Route>
        <Route element={<PrivacyPage/>} path="/privacy/"></Route>

        <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};
