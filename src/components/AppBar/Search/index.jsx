import { useState, useRef } from "react";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

function Search() {
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef(null);

  const handleClickDelete = () => {
    inputRef.current.focus();
  };

  return (
    <TextField
      id="outlined-search"
      label="Search..."
      type="text"
      size="small"
      value={searchValue}
      onChange={(e) => setSearchValue(e.target.value)}
      inputRef={inputRef}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "white" }} />
          </InputAdornment>
        ),
        endAdornment: (
          <CloseIcon
            fontSize="small"
            onClick={() => {
              setSearchValue("");
              handleClickDelete();
            }}
            sx={{
              color: "white",
              cursor: "pointer",
              display: searchValue.length === 0 ? "none" : "inline-block",
            }}
          />
        ),
      }}
      sx={{
        minWidth: "120px",
        maxWidth: "180px",
        "& label": { color: "white" },
        "& input": { color: "white" },
        "& label.Mui-focused": { color: "white" },
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "white" },
          "&:hover fieldset": { borderColor: "white" },
          "&.Mui-focused fieldset": { borderColor: "white" },
        },
      }}
    />
  );
}

export default Search;
