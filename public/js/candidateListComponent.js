(function ($, document, machine) {

    const Item = ({text, onDelete}) => (
        <li key={Math.random()} id={text}>{text}
            <span className="delete" title="Delete" onClick={() => onDelete(text)}><i className="fa fa-minus-circle"/></span>
        </li>);

    const CandidateList = ({items, onDelete}) => {

        return <ul className="item-list">{items.map((itemText, i) => <Item text={itemText} key={i} onDelete={onDelete}/>)}</ul>;
    };

    const ImportButton = () => {

        function processData(allText) {
            const allTextLines = allText.split(/\r\n|\n/);
            const headers = allTextLines[0].split(',');
            const lines = [];

            for (let i = 1; i < allTextLines.length; i++) {
                const data = allTextLines[i].split(',');
                if (data.length === headers.length) {

                    const tarr = [];
                    for (let j = 0; j < headers.length; j++) {
                        tarr.push(data[j]);
                    }
                    lines.push(tarr);
                }
            }
            return {headers, lines};
        }

        const onFileChange = (e) => {

            const files = e.target.files;

            console.log(files);

            const reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = function (e) {
                const content = e.target.result;
                const data = processData(content);
                data.lines.forEach((line) => {
                    machine.addCandidate(line.join('\t'));
                });
            };

            reader.readAsText(files[0]);
        };

        return (
            <label className={"btn positive-btn"} htmlFor={"file-input"}>
                Import from CSV {" "}<i className="fa fa-plus"/>
                <input type={"file"} style={{display: 'none'}} id={"file-input"} onChange={onFileChange}/>
            </label>
        )
    };

    class InputForm extends React.Component {

        constructor(props) {
            super(props);
            this.handleAdd = this.handleAdd.bind(this);
            this.handleChangeNumberOfDraws = this.handleChangeNumberOfDraws.bind(this);
            this.handleChangeFontSize = this.handleChangeFontSize.bind(this);
            this.state = {
                items: [],
                input: "",
                isWithoutReplacement: false,
                numberOfDraws: 1,
                winnerCodeFontSize: 1,
                winnerNameFontSize: 1
            }
        }

        componentDidMount() {
            fetch("/configs")
                .then((res) => res.json())
                .then((result) => {
                    this.setState({
                        items: result.candidates,
                        isWithoutReplacement: result.isWithoutReplacement,
                        numberOfDraws: result.numberOfDraws,
                        winnerCodeFontSize: result.winnerCodeFontSize,
                        winnerNameFontSize: result.winnerNameFontSize,
                        spinDuration: result.spinDuration
                    }, () => {
                        if (result.candidates.length > 0) {
                            window.showEditListView();
                        }
                        machine.onResultChange((poorMan) => {

                            /**
                             * Start audio and a new round
                             */
                            const audio = document.getElementById("lottery-sound");
                            audio.play();
                            window.spinning = true;
                            var spinDuration = this.state.spinDuration + 0;

                            // TODO convert these to React style
                            $('.main-container').removeClass('show animated fadeOutUp');
                            $('.main-container').addClass('hide');
                            $('#result-view-container').addClass('show animated fadeInDown');

                            /**
                             * Generate new winner info
                             */
                            const winner = (poorMan + '').split('\t');
                            const winnerId = winner[0].replace(' ', '');
                            const winnerNumber = winnerId.replace('-', '');
                            const winnerName = winner[1];
                            
                            /**
                             * Animate-out current winner if exist
                             */
                            const nameContainer = document.getElementById('winner-name-container');
                            if (nameContainer.childElementCount > 0) {
                                nameContainer.firstElementChild.classList.remove('lightSpeedIn');
                                nameContainer.firstElementChild.classList.add('zoomOutDown');
                            }

                            /**
                             * Append last winner (if exist) to trophy list
                             */
                            var winnerList = document.getElementById('winner-trophy-list');
                            var winnerGoldList = document.getElementById('winner-trophy-gold');
                            var winnerSilverList = document.getElementById('winner-trophy-silver');
                            var winnerBronzeList = document.getElementById('winner-trophy-bronze');

                            /**
                             * Generate trophy item
                             */
                            var winnerTrophyItem = document.createElement('h1');
                            winnerTrophyItem.classList.add("winner-trophy-item");
                            winnerTrophyItem.innerHTML = winnerId + '<br/>' + winnerName;

                            /**
                             * If new roll, append. If reroll, replace first child
                             */
                            if (window.isReroll) {
                                console.log("Reroll");
                                if (window.winnerCount < 3) {
                                    winnerBronzeList.removeChild(winnerBronzeList.firstElementChild);
                                }
                                if (window.winnerCount == 3 || window.winnerCount == 4) {
                                    winnerList.removeChild(winnerList.firstElementChild);
                                }
                            }
                            else {
                                console.log("New roll");
                                window.winnerCount++;
                            }
                            console.log("Winner: " + winner);
                            console.log("winnerCount: " + window.winnerCount);

                            /**
                             * Decorate winner item based on position
                             */
                            switch (window.winnerCount) {
                                case 1:
                                    winnerBronzeList.insertBefore(winnerTrophyItem, winnerBronzeList.firstChild);
                                    winnerTrophyItem.classList.add("bronze");
                                    break;
                                case 2:
                                        winnerBronzeList.insertBefore(winnerTrophyItem, winnerBronzeList.firstChild);
                                    winnerTrophyItem.classList.add("bronze");
                                    break;
                                case 3:
                                        winnerSilverList.insertBefore(winnerTrophyItem, winnerSilverList.firstChild);
                                    winnerTrophyItem.classList.add("silver");
                                    break;
                                case 4:
                                        winnerGoldList.insertBefore(winnerTrophyItem, winnerGoldList.firstChild);
                                    winnerTrophyItem.classList.add("gold");
                                    if (window.isReroll) {
                                        spinDuration = spinDuration * 2;
                                    }
                                    break;
                                default:
                                    break;
                            }
                            window.isReroll = false;

                            /**
                             * Generate new spin wheel for new winner
                             */
                            const container = $('#winner-id-container').empty();
                            
                            let count = 0;
                            for(var i = 0; i < winnerNumber.length; i++) {
                                /**
                                 * Before the third item, insert a dash
                                 */
                                if (i == 2) {
                                    container.append($("<h1>", {
                                        class: "winner",
                                        css: {
                                            'font-size': this.state.winnerCodeFontSize + 'px',
                                            'width': '0.6em'
                                        }
                                    }).append($("<span>").text("-")));
                                }

                                container.append($("<h1>", {
                                    class: "winner masked",
                                    css: {
                                        'font-size': this.state.winnerCodeFontSize + 'px'
                                    }
                                }).append($("<span>", {
                                    class: "spinWheel"
                                }).text("1 2 3 4 5 6 7 8 9 0")));
                            };

                            /**
                             * Reveal winner Id number by number
                             */
                            count = 0;
                            const t = setInterval(function () {
                                var winnerItem = $("<span>", {
                                    class: "animated impress"
                                }).text(winnerNumber[count]).hide();

                                $('.winner.masked:first')
                                .removeClass('masked')
                                .empty()
                                .append(winnerItem);
                                winnerItem.show('normal');
                                count++;
                                /**
                                 * End of spin
                                 */
                                if (count === winnerNumber.length) {
                                    clearInterval(t);

                                    /**
                                     * Update winner name
                                     */
                                    var winnerNameText = document.createElement('h1');
                                    winnerNameText.classList.add("animated", "lightSpeedIn");
                                    winnerNameText.style['font-size'] = '60px';
                                    winnerNameText.style['text-align'] = 'center';
                                    winnerNameText.innerHTML = winnerName;
                                    winnerNameText.style.display = 'none';
                                    
                                    nameContainer.querySelectorAll('*').forEach(n => n.remove());
                                    nameContainer.appendChild(winnerNameText);
                                    winnerNameText.style.display = 'block';

                                    /**
                                     * Smoothly stop audio
                                     */
                                    $('#lottery-sound').animate({volume: 0.1}, 1500);
                                    const audioStop = setInterval(function() {
                                        audio.pause();
                                        audio.volume = 1;
                                        clearInterval(audioStop);
                                    }, 2000);
                                    window.spinning = false;
                                }
                            }, spinDuration);
                        });
                    })
                });

            machine.onSettingChange((settings) => {

                this.setState({
                    ...settings
                });
            });

            machine.registerCandidatesUpdateHandler((candidates) => {
                this.setState({
                    items: candidates
                });
            });
        }

        handleChange(name) {
            return (e) => {
                this.setState({
                    [name]: e.target.value
                })
            }
        }

        handleChangeNumberOfDraws(e) {
            const v = e.target.value;
            this.setState({
                numberOfDraws: v
            }, () => {
                if (!isNaN(v)) {

                    machine.setSettings({numberOfDraws: +v});
                }
            })
        }

        handleChangeFontSize(e) {
            const v = e.target.value;
            this.setState({
                winnerCodeFontSize: v
            }, () => {
                if (!isNaN(v)) {

                    machine.setSettings({winnerCodeFontSize: +v});
                }
            })
        }

        handleAdd(e) {
            e.preventDefault();
            machine.addCandidate(this.state.input);
            this.setState({
                input: ""
            })
        }

        handleDelete(val) {

            machine.removeCandidate(val);
        }

        handleDeleteAll() {

            machine.clearCandidates();
        }

        handleInputDone(e) {
            console.log('Input done');
            $('.main-container').removeClass('show animated fadeOutUp');
            $('.main-container').addClass('hide');
            $('#start-view-container').addClass('show animated fadeInDown');
            document.body.style.backgroundImage = 'url(../images/background-womens-days.png)';
            document.getElementsByTagName('body')[0].style['background-blend-mode']  = 'multiply';
            if (window.winnerCount > 2) {
                $('#ready-heading').addClass('hide');
            }
        }

        setWithoutReplacement() {
            machine.setSettings({isWithoutReplacement: $('#rand-without-replacement').is(':checked')});
        }

        render() {

            return (
                <div>
                    <h1>Edit Items</h1>
                    <form id="edit-item-form" onSubmit={this.handleAdd}>
                        <input value={this.state.input} type="text" placeholder="Enter item name" id="new-candidate"
                               onChange={this.handleChange('input')}/>
                        <div className={"btn-set inline-block"}>
                            <button className="btn positive-btn" title="Add" onClick={this.handleAdd}>
                                <i className="fa fa-plus"></i>
                            </button>
                            <ImportButton/>
                        </div>
                        <div className="item-list-container">
                            <h2>Items List</h2>
                            <CandidateList items={this.state.items} onDelete={this.handleDelete}/>
                            <div className="text-right float-right">
                                <a className="delete-all" onClick={this.handleDeleteAll}>
                                    <i className="fa fa-times"></i>
                                    Delete All
                                </a>
                            </div>
                            {/* <div style={{marginBottom: 16, marginTop: 16 }}>
                                <label className={"block"} style={{marginBottom: 2}}>Number Of Draws per batch</label>
                                <input value={this.state.numberOfDraws} type="number" placeholder="Number Of Draws" id="number-of-draws"
                                       onChange={this.handleChangeNumberOfDraws} min={1} max={Math.max(this.state.items.length, 1)}/>
                            </div> */}
                            {/* <div style={{marginBottom: 16, marginTop: 16}}>
                                <label className={"block"} style={{marginBottom: 2}}>Font Size (in pixel)</label>
                                <input value={this.state.winnerCodeFontSize} type="number" placeholder="Font Size (in pixel)" id="font-size"
                                       onChange={this.handleChangeFontSize}/>
                            </div> */}
                            {/* <label htmlFor="rand-without-replacement" className="text-left">
                                <input checked={!!this.state.isWithoutReplacement} onChange={this.setWithoutReplacement} type="checkbox"
                                       id="rand-without-replacement" name="without-replacement"/>
                                Draw without replacement
                            </label> */}
                        </div>
                        <div className="btn-set">
                            <button className="btn primary-btn btn-done" onClick={this.handleInputDone}>Done</button>
                        </div>
                    </form>
                </div>
            );
        }
    }

    ReactDOM.render(
        <InputForm items={[]}/>, document.querySelector('#edit-item-container')
    );
})(jQuery, document, window.machine);
