import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Add01Icon,
  DeleteIcon,
  TerminalIcon,
  GitBranchIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  SparklesIcon,
  SearchIcon,
  CancelIcon,
  MoreVerticalIcon,
  Menu01Icon,
  GridIcon,
  Alert01Icon,
  BadgeInfoIcon,
  CheckIcon,
  AlertCircleIcon,
  ShieldIcon,
  ZapIcon,
  CloudServerIcon,
  LockIcon,
  CpuIcon,
  DatabaseIcon,
  WifiIcon,
  PlayIcon,
  MicIcon,
  MicOffIcon,
  LoaderPinwheelIcon,
  LogoutIcon,
  GithubIcon,
  KeyIcon,
  CopyIcon,
  RefreshIcon,
  ArrowUpRightIcon,
  TrendingUpDownIcon,
  HistoryIcon,
  BarChartIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  LaptopIcon,
  GitCommitIcon,
  FolderIcon,
  StopCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  GlobeIcon,
  AtomIcon,
  LinkIcon,
  FlameIcon,
  CodeIcon,
  GitPullRequestIcon,
  GitMergeIcon,
  AlertSquareIcon,
  FolderAddIcon,
  FilePlusIcon,
  FileIcon,
  FileCodeIcon,
  BookIcon,
  WrenchIcon,
  CreditCardIcon,
  UserIcon,
  MoonIcon,
  SunIcon,
  ActivityIcon,
  BoxIcon,
  MailIcon,
  InformationCircleIcon,
  TickIcon,
  AlertIcon,
  Folder01Icon,
  Home01Icon,
  Settings01Icon,
  HashIcon,
  FileBracesIcon,
  CssFileIcon,
  BotIcon,
  SquareIcon,
  PlugIcon,
  BubbleChatIcon,
  HardDriveIcon,
  Clock01Icon,
  SaveIcon,
  File02Icon,
  ExternalLinkIcon,
  FolderOpenIcon,
  MinusSignIcon,
  Upload01Icon,
  Download01Icon,
  CircleIcon,
  MaximizeIcon,
  MinimizeIcon,
  CancelCircleIcon,
  CornerDownRightIcon,
  SentIcon
} from '@hugeicons/core-free-icons';

interface ShimProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
  opacity?: number;
  fill?: string;
  [key: string]: any;
}

const createShim = (icon: any) => {
  return React.forwardRef<any, ShimProps>(({ size = 24, color = '#000000', strokeWidth = 2.0, style, ...props }, ref) => {
    return (
      <HugeiconsIcon
        ref={ref}
        icon={icon}
        size={size}
        color={color}
        strokeWidth={strokeWidth}
        style={style}
        {...props}
      />
    );
  });
};

// Map of standard Lucide components to Hugeicons
export const Plus = createShim(Add01Icon);
export const Trash2 = createShim(DeleteIcon);
export const Trash = createShim(DeleteIcon);
export const Terminal = createShim(TerminalIcon);
export const TerminalIconShim = createShim(TerminalIcon);
export { TerminalIconShim as TerminalIcon };
export const GitBranch = createShim(GitBranchIcon);
export const ChevronRight = createShim(ChevronRightIcon);
export const ChevronLeft = createShim(ChevronLeftIcon);
export const ChevronDown = createShim(ChevronDownIcon);
export const ChevronUp = createShim(ChevronUpIcon);
export const Sparkles = createShim(SparklesIcon);
export const Search = createShim(SearchIcon);
export const X = createShim(CancelIcon);
export const Cancel = createShim(CancelIcon);
export const MoreVertical = createShim(MoreVerticalIcon);
export const List = createShim(Menu01Icon);
export const Grid = createShim(GridIcon);
export const AlertTriangle = createShim(Alert01Icon);
export const Info = createShim(BadgeInfoIcon);
export const Check = createShim(CheckIcon);
export const CheckCircle = createShim(CheckIcon);
export const CheckCircle2 = createShim(CheckIcon);
export const AlertCircle = createShim(AlertCircleIcon);
export const Shield = createShim(ShieldIcon);
export const ShieldCheck = createShim(ShieldIcon);
export const Zap = createShim(ZapIcon);
export const Server = createShim(CloudServerIcon);
export const Lock = createShim(LockIcon);
export const LockKeyhole = createShim(LockIcon);
export const Cpu = createShim(CpuIcon);
export const Database = createShim(DatabaseIcon);
export const Wifi = createShim(WifiIcon);
export const Play = createShim(PlayIcon);
export const Mic = createShim(MicIcon);
export const MicOff = createShim(MicOffIcon);
export const Loader = createShim(LoaderPinwheelIcon);
export const Loader2 = createShim(LoaderPinwheelIcon);
export const LogOut = createShim(LogoutIcon);
export const Github = createShim(GithubIcon);
export const Key = createShim(KeyIcon);
export const Copy = createShim(CopyIcon);
export const RefreshCw = createShim(RefreshIcon);
export const ArrowUpRight = createShim(ArrowUpRightIcon);
export const TrendingUp = createShim(TrendingUpDownIcon);
export const History = createShim(HistoryIcon);
export const BarChart2 = createShim(BarChartIcon);
export const BarChart = createShim(BarChartIcon);
export const ArrowLeft = createShim(ArrowLeftIcon);
export const ArrowRight = createShim(ArrowRightIcon);
export const Eye = createShim(EyeIcon);
export const EyeOff = createShim(EyeOffIcon);
export const Laptop = createShim(LaptopIcon);
export const GitCommit = createShim(GitCommitIcon);
export const Folder = createShim(FolderIcon);
export const StopCircle = createShim(StopCircleIcon);
export const ArrowUp = createShim(ArrowUpIcon);
export const ArrowDown = createShim(ArrowDownIcon);
export const Globe = createShim(GlobeIcon);
export const Atom = createShim(AtomIcon);
export const Link2 = createShim(LinkIcon);
export const Link = createShim(LinkIcon);
export const Flame = createShim(FlameIcon);
export const Code = createShim(CodeIcon);
export const GitPullRequest = createShim(GitPullRequestIcon);
export const GitMerge = createShim(GitMergeIcon);
export const AlertSquare = createShim(AlertSquareIcon);
export const FolderPlus = createShim(FolderAddIcon);
export const FolderAdd = createShim(FolderAddIcon);
export const FilePlus = createShim(FilePlusIcon);
export const File = createShim(FileIcon);
export const FileCode = createShim(FileCodeIcon);
export const Book = createShim(BookIcon);
export const Wrench = createShim(WrenchIcon);
export const CreditCard = createShim(CreditCardIcon);
export const User = createShim(UserIcon);
export const Moon = createShim(MoonIcon);
export const Sun = createShim(SunIcon);
export const Activity = createShim(ActivityIcon);
export const Box = createShim(BoxIcon);
export const Mail = createShim(MailIcon);
export const InformationCircle = createShim(InformationCircleIcon);
export const Tick = createShim(TickIcon);
export const Alert = createShim(AlertIcon);
export const Folder01 = createShim(Folder01Icon);
export const Home01 = createShim(Home01Icon);
export const Settings01 = createShim(Settings01Icon);
export const Hash = createShim(HashIcon);
export const FileJson = createShim(FileBracesIcon);
export const CssFile = createShim(CssFileIcon);

// New additions from typecheck results
export const Bot = createShim(BotIcon);
export const Square = createShim(SquareIcon);
export const Plug = createShim(PlugIcon);
export const MessageSquare = createShim(BubbleChatIcon);
export const Settings = createShim(Settings01Icon);
export const HardDrive = createShim(HardDriveIcon);
export const Clock = createShim(Clock01Icon);
export const Save = createShim(SaveIcon);
export const FileText = createShim(File02Icon);
export const Columns = createShim(GridIcon);
export const ExternalLink = createShim(ExternalLinkIcon);
export const FolderOpen = createShim(FolderOpenIcon);
export const Minus = createShim(MinusSignIcon);
export const Upload = createShim(Upload01Icon);
export const Download = createShim(Download01Icon);
export const Circle = createShim(CircleIcon);
export const Home = createShim(Home01Icon);
export const Maximize2 = createShim(MaximizeIcon);
export const Minimize2 = createShim(MinimizeIcon);
export const XCircle = createShim(CancelCircleIcon);
export const CornerDownRight = createShim(CornerDownRightIcon);
export const Send = createShim(SentIcon);
